# Huong dan tu chay local + webhook tunnel (sau moi lan mo terminal moi)

Tai lieu nay giup ban tu chay lai du an sau khi lo dong terminal, va lay URL tunnel moi de gan webhook.

## 1. Mo 3 terminal rieng

- Terminal 1: Backend
- Terminal 2: Frontend
- Terminal 3: Tunnel webhook

## 2. Chay backend

```bash
cd "c:/Users/Admin/OneDrive - ptit.edu.vn/Desktop/LMS/server"
nvm use 24.14.1
npm run server
```

Khi backend OK, ban se thay:

- MongoDB connected successfully
- Server running on port 5000

## 3. Chay frontend

```bash
cd "c:/Users/Admin/OneDrive - ptit.edu.vn/Desktop/LMS/client"
nvm use 24.14.1
npm run dev -- --host 0.0.0.0 --port 5173
```

Frontend local:

- http://localhost:5173

## 4. Tao tunnel webhook va luu log de de lay URL moi

Chay lenh duoi day trong Terminal 3:

```bash
cd "c:/Users/Admin/OneDrive - ptit.edu.vn/Desktop/LMS"
mkdir -p .tunnel
ssh -o StrictHostKeyChecking=no -R 80:localhost:5000 nokey@localhost.run | tee .tunnel/latest.log
```

Moi lan ban chay lai lenh tunnel, URL se doi.

## 5. Xem URL tunnel moi o dau

### Cach 1: Xem truc tiep tren Terminal 3
Tim dong co dang:

- `... tunneled with tls termination, https://xxxxx.lhr.life`

### Cach 2: Lay URL tu file log
Mo terminal moi va chay:

```bash
grep -Eo 'https://[a-zA-Z0-9.-]+\.lhr\.life' .tunnel/latest.log | tail -1
```

Lenh tren se in ra URL tunnel moi nhat.

## 6. Gan webhook tu URL moi

Neu URL moi la `https://abc123.lhr.life` thi:

- Clerk webhook: `https://abc123.lhr.life/clerk`
- Stripe webhook: `https://abc123.lhr.life/stripe`

## 7. Kiem tra nhanh URL tunnel hoat dong

```bash
curl -sS https://abc123.lhr.life/
```

Ky vong ket qua:

- API Working

## 8. Luu y quan trong

- Khong dong Terminal 3 neu dang test webhook.
- Neu dong Terminal 3, URL tunnel se mat, ban phai chay lai buoc 4.
- Moi lan URL tunnel doi, can cap nhat lai webhook URL trong Clerk va Stripe.
