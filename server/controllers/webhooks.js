import { Webhook } from "svix"
import User from "../models/User.js"
import Stripe from "stripe"
import { Purchase } from "../models/Purchases.js"
import Course from "../models/Course.js"

const getClerkUserName = (data) => {
  const firstName = data?.first_name?.trim() || ''
  const lastName = data?.last_name?.trim() || ''
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName

  const primaryEmail = data?.email_addresses?.[0]?.email_address
  if (primaryEmail) return primaryEmail.split('@')[0]

  return 'Unknown User'
}

// API Controller function to manage clerk user with database
export const clerkWebhooks = async (req, res) => {
  console.log('=== WEBHOOK CALLED ===');
  try {
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      return res.status(500).json({ success: false, message: 'Missing CLERK_WEBHOOK_SECRET' })
    }

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const payload = req.body.toString('utf8')

    const evt = whook.verify(payload, {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature']
    });

    const {data, type} = evt;
    console.log('Webhook type:', type);
    console.log('Webhook data ID:', data?.id);

    switch (type) {
      case 'user.created': {
        console.log('>>> Processing user.created event');
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: getClerkUserName(data),
          imageUrl: data.image_url,
          role: 'student' // Mặc định là student
        };
        console.log('>>> Preparing to create user:', JSON.stringify(userData, null, 2));
        
        const user = await User.create(userData);
        console.log('>>> User created successfully:', user._id, 'with role:', user.role);
        res.json({ success: true });
        break;
      }
      case 'user.updated': {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: getClerkUserName(data),
          imageUrl: data.image_url
        };
        console.log('Preparing to update user:', userData);
        const user = await User.findByIdAndUpdate(data.id, userData);
        console.log('User updated:', user);
        res.json({});
        break;
      }
      case 'user.deleted': {
        console.log('Preparing to delete user with id:', data.id);
        const user = await User.findByIdAndDelete(data.id);
        console.log('User deleted:', user);
        res.json({});
        break;
      }
      default:
        console.log('Unhandled webhook type:', type);
        break;
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.json({success: false, message: error.message});
  }
}

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
export const stripeWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  }
  catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const paymentIntentId = paymentIntent.id
        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
        })
        
        if (!session.data[0]?.metadata?.purchaseId) {
          console.error('No purchaseId in session metadata')
          break
        }
        
        const { purchaseId } = session.data[0].metadata

        const purchaseData = await Purchase.findById(purchaseId)
        if (!purchaseData) {
          console.error('Purchase not found:', purchaseId)
          break
        }

        const userData = await User.findById(purchaseData.userId)
        const courseData = await Course.findById(purchaseData.courseId.toString())

        if (!userData || !courseData) {
          console.error('User or Course not found')
          break
        }

        // Add student to course if not already enrolled
        if (!courseData.enrolledStudents.includes(userData._id)) {
          courseData.enrolledStudents.push(userData._id)
          await courseData.save()
        }

        // Add course to user if not already enrolled
        if (!userData.enrolledCourses.map(c => c.toString()).includes(courseData._id.toString())) {
          userData.enrolledCourses.push(courseData._id)
          await userData.save()
        }

        purchaseData.status = 'completed'
        await purchaseData.save()

        console.log('Payment succeeded for purchase:', purchaseId)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const paymentIntentId = paymentIntent.id
        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
        })
        
        if (session.data[0]?.metadata?.purchaseId) {
          const { purchaseId } = session.data[0].metadata
          const purchaseData = await Purchase.findById(purchaseId)
          
          if (purchaseData) {
            purchaseData.status = 'failed'
            await purchaseData.save()
            console.log('Payment failed for purchase:', purchaseId)
          }
        }
        break
      }
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true })
}

