# 🔑 How to Get Your Auth Token for Testing

**Quick guide to get your Supabase auth token for AI notification testing**

## 🚀 **Method 1: Browser Console (Easiest)**

1. **Open your Next.js app** in a browser: `http://localhost:3000`

2. **Open Developer Tools** (F12 or right-click → Inspect)

3. **Go to Console tab**

4. **Paste this code** and press Enter:
```javascript
// Create a Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(
  'YOUR_SUPABASE_URL', // Replace with your actual URL
  'YOUR_SUPABASE_ANON_KEY' // Replace with your actual anon key
);

// Sign in and get token
const signInAndGetToken = async () => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: 'your-test@email.com', // Replace with your test user email
    password: 'your-password' // Replace with your test user password
  });
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Success! Your auth token:');
    console.log(data.session.access_token);
    console.log('\n📋 Copy this token to use in tests');
  }
};

signInAndGetToken();
```

5. **Copy the token** that appears in the console

---

## 🔧 **Method 2: Using Your App's Auth (If Available)**

If your app has a login page:

1. **Login to your app** normally
2. **Open Developer Tools** → **Application tab** → **Local Storage**
3. **Look for Supabase session data** and copy the `access_token`

---

## 👤 **Method 3: Create Test User First**

If you don't have a test user:

1. **Go to Supabase Dashboard** → **Authentication** → **Users**
2. **Click "Add user"**
3. **Create a test user:**
   - Email: `test@yourapp.com`
   - Password: `testpassword123`
   - Email Confirmed: ✅ Check this
4. **Use Method 1** with these credentials

---

## 🧪 **Method 4: Node.js Script**

Create a simple script to get the token:

```javascript
// get-token.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@yourapp.com',
    password: 'testpassword123'
  });
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Token:', data.session.access_token);
  }
}

getToken();
```

Run with: `node get-token.js`

---

## 📝 **Using the Token**

Once you have your token:

1. **Open the test page**: `http://localhost:3000/test-ai-notifications.html`
2. **Paste the token** in the "Authorization Token" field
3. **Set your User ID** (usually the UUID from Supabase auth)
4. **Click "Save Config"**
5. **Run your tests!**

---

## 🔍 **Finding Your User ID**

Your User ID is in the Supabase auth response:

```javascript
// In the auth response, look for:
data.user.id // This is your User ID
```

Or check **Supabase Dashboard** → **Authentication** → **Users** → Copy the UUID

---

## ⚡ **Quick Test Command**

```bash
# Test if your token works
curl -X GET "http://localhost:3000/api/notifications/ai?action=behavior&user_id=YOUR_USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Should return user behavior data or empty object (not an error)**

---

## 🎯 **Ready to Test!**

With your auth token, you can now:
- ✅ Test all AI notification features
- ✅ Track engagement events  
- ✅ Generate predictive insights
- ✅ Validate rate limiting
- ✅ Check error handling

**🚀 Go to: `http://localhost:3000/test-ai-notifications.html`** 