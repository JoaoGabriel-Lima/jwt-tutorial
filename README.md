# How to secure sensitive endpoints using JWT in Node.js

Repository created in this article: [jwt-tutorial](https://github.com/JoaoGabriel-Lima/jwt-tutorial)
When I started to develop backend projects, I was very concerned about the security of my endpoints and a question came to my mind: if anyone can make requests to my backend application, how do I protect my Rest API against malicious people? I spent months searching about it and I would like to share what I found.

## The problem

To demonstrate the problem of not securing a sensitive endpoint, let's look at the code below:

```js
router.get("/users", async (req, res) => {
  try {
    let users = await prisma.user.findMany();
    res.status(200).json({ data: users });
  } catch (error) {
    next(error);
  }
});
```

```js
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    user = await prisma.user.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({
      message: "Successfully Deleted",
      data: user,
    });
  } catch (error) {
    next(error);
  }
});
```

In these code blocks, we have a couple of endpoints. One to get all the users from the database, and the other to remove any user by their ID.

These endpoints can be a good combination for an admin to manage their users, however, can also be a huge problem if an average user knows about them. Because the same way an admin can remove a specific user, an average user can remove anyone they want. And that's why we need to double the attention on codes like this.

What an average user should see as a response:
❌ `-> [200] All users deleted`
✔️ `-> [401] You are not authorized to perform this action`

## The Solution

When I was taking my first steps into security, my first suggestion was to change the method of the request from GET (or DELETE) to POST, ask the user email in the body of the request, and check user permission on the database.

![Solution Request](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5ue0j8xzy4jaaqdtixmf.png) ![Solution Response](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/423b46zboamwxui7ie9p.png)

As you can see, this solution worked as expected, but it still has a big concern. The idea of using user email and checking their permission will not prevent malicious people from using an admin email, which can be easy to get with social engineering, and use programs like [Insominia](https://insomnia.rest/download) or [Postman](https://www.postman.com/) to get the same response as an unprotected endpoint.

### So, what can we do?

The previous solution was going the right way to solve this security problem. The issue with that solution is that we used public information (email) as our “token”.

We need a unique token that dynamically changes according to the user, where no one could decorate it like an email. And this is where [JWT](https://jwt.io/) joins the party. 🎉

### How does JWT work?

JWT, or JSON Web Token, is an open standard used to share information between two parties securely — a client and a server. JWT will encode and & sign our JSON data (payload), ensuring the authenticity of the data sent to the backend.

Before showing some examples, let me explain about JWT string structure.

#### Structure of JWT

A JWT is a string made up of three parts, separating `header`, `payload`, and `signature` by dots (.), and serialized using base64.

![JWT Structure](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nh2p0uwmg3n4j45rrfsq.png)

#### Examples

All we need to encode our data is our JSON payload and a secret password. So, let's use the information below:

Payload:

```json
{
  "email": "adminuser@gmail.com",
  "userID": "58f904a2-7240-4548-abe2-19c87d5e5201"
}
```

Secret Key:

```json
JWT_TUTORIAL_TEST
```

Encoding with [JWT](https://jwt.io/) using the default header value, we get this token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWludXNlckBnbWFpbC5jb20iLCJ1c2VySUQiOiI1OGY5MDRhMi03MjQwLTQ1NDgtYWJlMi0xOWM4N2Q1ZTUyMDEifQ.YEtbgL8EzCdi2qbFgHN3GDxCZbwMFFubwPZbJc6j0go
```

Decoding with [JWT](https://jwt.io/) using `JWT_TUTORIAL_TEST` secret key, we get this JSON:

```json
{
  "email": "adminuser@gmail.com",
  "userID": "58f904a2-7240-4548-abe2-19c87d5e5201"
}
```

### But, how can we use this token in our backend?

As we saw before introducing JWT, we need a unique token capable to distinguish one user from another. With JSON Web Token, we can send an encoded email as a token to the backend and decode it with our secret key stored in the environment variables of our backend application. Preventing people to manipulate the data of the request like my first solution.

![JWT Authentication Flow](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1y429gxq67x45jweoazt.png)

#### Step by step

The Authentication Flow is easy:
Note: **We never encode or decode JWT Tokens in the frontend**

When the frontend makes a request to the login endpoint in our backend, besides checking email + password in the database like a normal login endpoint, the backend will be also responsible to generate a JWT Token (with user email or user ID as the JSON payload as shown in **Structure of JWT** section). The token will be sent as the response of the login endpoint.

`/api/auth/login` response example:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWludXNlckBnbWFpbC5jb20iLCJ1c2VySUQiOiI1OGY5MDRhMi03MjQwLTQ1NDgtYWJlMi0xOWM4N2Q1ZTUyMDEifQ.YEtbgL8EzCdi2qbFgHN3GDxCZbwMFFubwPZbJc6j0go",
  "tokenType": "Bearer"
}
```

2. Once getting the JWT Token, we have to store them in the frontend using cookies to use in future requests to sensitive endpoints.

3. When making a request to a sensitive endpoint, we use the JWT Token stored in the frontend as the [Authorization Header](https://flaviocopes.com/axios-send-authorization-header/) (Bearer Token) of the request.

4. In the sensitive endpoint, the backend will decode the JWT Token using the secret key (stored in the environment variables of the **backend application**) and check user permission in the database using the email or user ID of the decoded JWT Token. The endpoint will send `401 Unathorized` if the user doesn't have enough permission, or `200 OK` if the user has enough permission.

With this four steps, you can easily implement JWT security in [any backend framework](https://jwt.io/libraries)! 🥳

## Let's implement JWT in Node.js Rest API

I won't delve into how to make a Rest API from zero, if you don't know how to make one or don't know about Rest API concepts like middlewares, feel free to search online while following the tutorial.

So, this is my file structure:

```
> node_modules
> prisma
> src
  > controllers
    auth.controller.js
    user.controller.js
  > middleware
  > provider
  > routes
    api.route.js
  app.js
.env
.gitignore
package.json
yarn.lock
```

For this tutorial, I will be using [Express.js](https://expressjs.com/) + [Bcrypt](https://www.npmjs.com/package/bcrypt) + [Prisma](https://www.prisma.io/) to create a simple SQLite database to manage the users.

This is my prisma schema:

```js
model User {
  id          Int @id @default(autoincrement())
  userId      String @unique
  name        String
  username    String @unique
  email       String @unique
  password    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  permissions String @default("USER")
}
```

Before implementing JWT, I created the login endpoint function below and two other endpoints, one to add a new user and another to list all users in the database:

```javascript
// ./src/controllers/auth.controller.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

// This function will check the user email and password in the database and will return status 200 if find a user.
exports.login = async function (req, res, next) {
  try {
    // Return code 401 if miss parameters
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ message: "Missing parameters" });
    }
    // Return code 401 if not found a valid email or password
    let user = await prisma.user.findUnique({ where: { email } });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid || !user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // Return 200 if email and password match with database info
    res.status(200).json({
      status: "OK",
    });
  } catch (error) {
    next(error);
  }
};
```

These is all the routes of my API:

```js
// ./src/routes/api.route.js
const router = require("express").Router();
const UserController = require("../controllers/user.controller");
const AuthController = require("../controllers/auth.controller");

//! User routes
router.get("/AllUsers", UserController.getAllUsers);
router.post("/users", UserController.addUser);

//! Auth routes
router.post("/login", AuthController.login);

module.exports = router;
```

As we saw in the **Step by Step** section, our JWT Token needs to be the response of our login endpoint. So, before making the Token Provider file, we need to install JSON Web Token in our project:

```
npm install jsonwebtoken
```

or if you use yarn:

```
yarn add jsonwebtoken
```

With JWT installed, we are going to create a new JavaScript file inside provider folder called `generateToken.provider.js`

```
  > provider
    generateToken.provider.js
```

The main idea of this file is to create a class to sign a JSON with userID using the `sign` function from the `jsonwebtoken` library. In the end, we will have something like this:

```javascript
// ./src/provider/generateToken.provider.js

var jwt = require("jsonwebtoken");

// * This class is responsible for creating and returning a new encoded and signed access token with user userID.

class GenerateToken {
  async execute(userId) {
    const token = jwt.sign(
        { userId: userId },
        `${process.env.JWT_SECRET}`,
    });
    return token;
  }
}

module.exports = GenerateToken;
```

The next step is to implement this class in our login endpoint to generate the token after checking if the email and password are valid:

```js
// ./src/controllers/auth.controller.js

// Importing GenerateToken module in our auth controller
const GenerateToken = require("../provider/GenerateTokenProvider");
```

```js
// ./src/controllers/auth.controller.js

...
// Generate token and return as response if login is valid
const generateToken = new GenerateToken();
const token = await generateToken.execute(user.userId);

res.status(200).json({
    status: "OK",
    data: { AccessToken: token },
});
```

Using the endpoint I created to add an account easily and making a request to the login endpoint using Insominia, we get:

![Login Endpoint Result](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hosreg5s6yoafwuor6f2.png)

As you can see, each user will have their token right now. This token should be stored in an **`httpOnly cookie`** to be better in terms of exposure to XSS attacks.

The final step is to create a middleware inside the middleware folder to verify user tokens and allow them to get the response of the sensitive endpoints:

```
  > middleware
    ensureAuthenticated.middleware.js
```

Before start editing this file, we need to understand how the backend recive our token:

The type of JWT Token is the `Bearer Token`, which means that when we send a request with this token in the Authorization Header, the backend will get a string like this:

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWludXNlckBnbWFpbC5jb20iLCJ1c2VySUQiOiI1OGY5MDRhMi03MjQwLTQ1NDgtYWJlMi0xOWM4N2Q1ZTUyMDEifQ.YEtbgL8EzCdi2qbFgHN3GDxCZbwMFFubwPZbJc6j0go
```

As we only need the token and not "Bearer ", our first step is to split this string:

```js
// ./src/middleware/ensureAuthenticated.middleware.js

const { verify } = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.ensureAuthenticated = async function (req, res, next) {

  // Get the token from the Authorization header
  const authToken = req.headers.authorization;

  // Return code 401 if no token is provided
  if (!authToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Slit the token to remove the "Bearer " part
  const token = authToken.split(" ")[1];
```

Now, all we have to do is to use the `verify` function from the `jsonwebtoken` library and get an object with the user userId:

```js
// ./src/middleware/ensureAuthenticated.middleware.js

...
  const token = authToken.split(" ")[1];

  // Verify the token and check if the user exists. Any error will return code 401
  try {
    // the user const contains a object with the userId
    const user = verify(token, process.env.JWT_SECRET);

    // Check if a user with this userId exists in the database.
    const isUserValid = await prisma.user.findUnique({
      where: { userId: user.userId },
    });
    if (!isUserValid) {
      return res.status(401).json({ message: "This Token is Invalid" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "This Token is Invalid" });
  }
```

Before starting making some tests, we have to implement our middleware in our sensitive endpoints. I'll be using a simple endpoint that lists all users in the database as an example:

```js
const {
  ensureAuthenticated,
} = require("../middleware/ensureAuthenticated.middleware");

//! User routes
router.get("/AllUsers", ensureAuthenticated, UserController.getAllUsers);
```

The full file will loke like this:

```js
// ./src/routes/api.route.js

const router = require("express").Router();
const UserController = require("../controllers/user.controller");
const AuthController = require("../controllers/auth.controller");
const {
  ensureAuthenticated,
} = require("../middleware/ensureAuthenticated.middleware");

//! User routes
router.get("/allUsers", ensureAuthenticated, UserController.getAllUsers);
router.post("/users", UserController.addUser);

//! Auth routes
router.post("/login", AuthController.login);

module.exports = router;
```

Now, if we try to make a request to `/allUsers` endpoint without a token, we will get:
![Invalid Token Response](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fv27mxpox6jcm6aja9lp.png)

But adding our token in the Insominia Authorization Header and making a request to `/allUsers`, we get:

![Valid Token Response](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k30pwmc6gdi5qsp2fmbh.png)

And finally, you have a secure REST API with JWT Authentication 🥳🥳🎉
Remember to see the GitHub repo to see all code. [Github repo link](https://github.com/JoaoGabriel-Lima/jwt-tutorial)

## What's next?

JWT Access Token Authentication is only a grain of sand compared with the infinity of other security methods you can implement in your backend code. If you're interested in continuing to studying about security, you must see **refresh tokens** and **how to protect tokens**, this will further complement the lessons learned in this article.

##Ending
So, This is my first article and it took me three long days to write. If you have a question, feel free to send me a DM on [Twitter](https://twitter.com/juaozin__) or talk with me on Discord (Jão#6140). I hope to have time in the future to continue writing to you all! See you in the next time! 👋🏾
