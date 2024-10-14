# **Mock Bank API - README**

## **Introduction**

Welcome to the **Mock Bank API**! This API simulates a banking system that allows third-party applications to interact with bank accounts securely. It demonstrates authentication and authorization flows using **OAuth2-like mechanisms** and **JWT tokens**. The API ensures that only authorized clients and users can perform specific actions, enforcing the principle of **least privilege**.

---

## **Table of Contents**

- [Introduction](#introduction)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Setup and Installation](#setup-and-installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
    - [1. Client Authentication](#1-client-authentication)
    - [2. Account Holder Authentication](#2-account-holder-authentication)
    - [3. Generate User Consent Token](#3-generate-user-consent-token)
    - [4. Get Account Balance](#4-get-account-balance)
- [Testing the API](#testing-the-api)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Conclusion](#conclusion)

---

## **Features**

- **Third-Party Client Authentication**: Securely authenticate third-party applications.
- **Account Holder Authentication**: Verify user credentials and generate user tokens.
- **User Consent Flow**: Allow users to grant specific permissions to third-party apps.
- **Account Balance Inquiry**: Access account balances with proper authorization.
- **JWT Token-Based Security**: Secure endpoints using JWT tokens with claims.

---

## **Technology Stack**

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js.
- **JSON Web Tokens (JWT)**: For secure authentication and authorization.
- **bcryptjs**: For hashing passwords.
- **dotenv**: For environment variable management.

---

## **Prerequisites**

- **Node.js** (v12 or higher)
- **npm** (Node Package Manager)
- **Git** (optional, for cloning the repository)
- **curl** or **Postman** (for API testing)

---

## **Setup and Installation**

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/bank-api.git
   cd bank-api
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Create Environment Variables**

   Create a `.env` file in the root directory with the following content:

   ```env
   PORT=3000
   JWT_SECRET=your_secret_key
   TOKEN_EXPIRATION=1h
   CLIENT_ID=third_party_app
   CLIENT_SECRET=third_party_secret
   ```

    - Replace `your_secret_key` with a secure random string.

4. **Set Up Mock User Data**

   Ensure there's a `users.json` file in the root directory with mock user data:

   ```json
   [
     {
       "id": "1",
       "username": "john_doe",
       "password": "$2a$10$sI6eLdPAzLQcA7KM97.pO.dJe82FQ0B8wnEzlyP6fGRj9bPBPMcTq",
       "account_number": "1234567890",
       "balance": 1000
     }
   ]
   ```

    - The password corresponds to `password123`.

---

## **Running the Application**

Start the API server with the following command:

```bash
node index.js
```

You should see:

```
Bank API running on http://localhost:3000
```

---

## **API Endpoints**

### **1. Client Authentication**

Authenticate a third-party client application to obtain a client token.

- **URL**: `/auth/third-party`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:

  ```json
  {
    "client_id": "third_party_app",
    "client_secret": "third_party_secret"
  }
  ```

- **Success Response**:

    - **Code**: 200 OK
    - **Content**:

      ```json
      {
        "access_token": "<client_token>",
        "expires_in": "1h"
      }
      ```

### **2. Account Holder Authentication**

Authenticate an account holder to obtain a user token.

- **URL**: `/auth/account-holder`
- **Method**: `POST`
- **Headers**:

  ```
  Content-Type: application/json
  client-authorization: Bearer <client_token>
  ```

- **Body**:

  ```json
  {
    "username": "john_doe",
    "password": "password123"
  }
  ```

- **Success Response**:

    - **Code**: 200 OK
    - **Content**:

      ```json
      {
        "access_token": "<user_token>",
        "expires_in": "15m"
      }
      ```

### **3. Generate User Consent Token**

Generate a consent token to allow the third-party app to act on behalf of the user.

- **URL**: `/consent`
- **Method**: `POST`
- **Headers**:

  ```
  Content-Type: application/json
  client-authorization: Bearer <client_token>
  Authorization: Bearer <user_token>
  ```

- **Body**:

  ```json
  {
    "user_token": "<user_token>"
  }
  ```

- **Success Response**:

    - **Code**: 200 OK
    - **Content**:

      ```json
      {
        "consent_token": "<consent_token>",
        "expires_in": "10m"
      }
      ```

### **4. Get Account Balance**

Retrieve the account holder's balance using the consent token.

- **URL**: `/account/balance`
- **Method**: `GET`
- **Headers**:

  ```
  client-authorization: Bearer <client_token>
  Authorization: Bearer <consent_token>
  ```

- **Success Response**:

    - **Code**: 200 OK
    - **Content**:

      ```json
      {
        "account_number": "1234567890",
        "balance": 1000
      }
      ```

---

## **Testing the API**

### **Step 1: Authenticate the Client Application**

```bash
curl -X POST http://localhost:3000/auth/third-party \
-H "Content-Type: application/json" \
-d '{
  "client_id": "third_party_app",
  "client_secret": "third_party_secret"
}'
```

**Expected Response:**

```json
{
  "access_token": "<client_token>",
  "expires_in": "1h"
}
```

### **Step 2: Authenticate the Account Holder**

```bash
curl -X POST http://localhost:3000/auth/account-holder \
-H "Content-Type: application/json" \
-H "client-authorization: Bearer <client_token>" \
-d '{
  "username": "john_doe",
  "password": "password123"
}'
```

**Expected Response:**

```json
{
  "access_token": "<user_token>",
  "expires_in": "15m"
}
```

### **Step 3: Generate User Consent Token**

```bash
curl -X POST http://localhost:3000/consent \
-H "Content-Type: application/json" \
-H "client-authorization: Bearer <client_token>" \
-H "Authorization: Bearer <user_token>" \
-d '{
  "user_token": "<user_token>"
}'
```

**Expected Response:**

```json
{
  "consent_token": "<consent_token>",
  "expires_in": "10m"
}
```

### **Step 4: Get Account Balance**

```bash
curl -X GET http://localhost:3000/account/balance \
-H "client-authorization: Bearer <client_token>" \
-H "Authorization: Bearer <consent_token>"
```

**Expected Response:**

```json
{
  "account_number": "1234567890",
  "balance": 1000
}
```

---

## **Error Handling**

- **401 Unauthorized**: Missing, invalid, or expired tokens.

  ```json
  {
    "message": "Invalid or expired token"
  }
  ```

- **403 Forbidden**: Insufficient permissions in the consent token.

  ```json
  {
    "message": "Insufficient permissions"
  }
  ```

- **400 Bad Request**: Missing required fields or invalid data.

  ```json
  {
    "message": "Bad Request: [details]"
  }
  ```

---

## **Security Considerations**

- **Token Expiration**: Tokens have expiration times (`expires_in`) to enhance security.
- **JWT Verification**: All tokens are signed and verified using a secret key.
- **Claims-Based Authorization**: Access to resources is controlled via token claims.
- **Environment Variables**: Sensitive data is stored in environment variables using `.env` file.

---

## **Conclusion**

The Mock Bank API demonstrates how to securely interact with banking services using modern authentication and authorization techniques. It can serve as a foundation for developing more complex financial applications or integrating with actual banking APIs.

---

## **Future Enhancements**

- **Additional Endpoints**: Implement transaction history, fund transfers, etc.
- **Database Integration**: Replace the mock data with a real database.
- **Enhanced Security**: Implement token revocation and refresh tokens.
- **Rate Limiting**: Prevent abuse by limiting the number of requests.

---

## **Contact**

For questions or support, please open an issue on the repository or contact the maintainer.

---

**Note**: This API is for demonstration purposes only and should not be used in production environments without proper security audits and enhancements.