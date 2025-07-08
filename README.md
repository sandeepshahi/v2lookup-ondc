# Typescript Utility for v2.0/lookup

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/sandeepshahi/v2lookup-ondc.git
cd v2lookup-ondc
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment Variables

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Example Usage (run.js)

```js
const { v2LookUp } = require("./dist/index");

v2LookUp({
  subscriberId: process.env.SUBSCRIBER_ID, //subscriber_id of sender
  privateKey: process.env.PRIVATE_KEY,
  ukId: process.env.UKID,
  env: process.env.ENV, //staging,preprod,prod
  saveJson: true, //whether to save the response in JSON or not
  //lookup payload
  payload: {
    country: "IND",
    subscriber_id: "example-subscriber-id.com",
  },
}).then((res) => console.log(res));
```
