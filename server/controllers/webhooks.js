import { Webhook } from "svix"
import User from "../models/User.js"

// API Controller function to manage clerk user with database
export const clerkWebhooks = async (req, res) => {
  console.log('Webhook called');
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature']
    });

    const {data, type} = req.body;
    console.log('Webhook type:', type);
    console.log('Webhook data:', data);

    switch (type) {
      case 'user.created': {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + ' ' + data.last_name,
          imageUrl: data.image_url
        };
        console.log('Preparing to create user:', userData);
        const user = await User.create(userData);
        console.log('User created:', user);
        res.json({});
        break;
      }
      case 'user.updated': {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + ' ' + data.last_name,
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

