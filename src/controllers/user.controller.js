const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const generateRandomString = async function () {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 12; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  const userExists = await prisma.user.findUnique({
    where: { userId: result },
  });
  if (userExists) {
    generateRandomString();
  }
  return result;
};

// This function will return all users from the database.
exports.getAllUsers = async function (req, res, next) {
  try {
    let users = await prisma.user.findMany({
      select: {
        userId: true,
        name: true,
        email: true,
        permissions: true,
        updatedAt: true,
        createdAt: true,
      },
    });
    res.status(201).json({ data: users });
  } catch (error) {
    next(error);
  }
};

// This function will add a new user to the database and return code 201.
exports.addUser = async function (req, res, next) {
  // Return code 400 if miss parameters
  const { name, email, password, username } = req.body;
  if (!name || !email || !password || !username) {
    return res.status(400).json({ message: "Missing parameters" });
  }
  // Return code 400 if email already exists
  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    return res
      .status(400)
      .json({ message: "This email has already been registered" });
  }
  const usernameHasTaken = await prisma.user.findUnique({
    where: { username: username },
  });
  // Return code 400 if username already exists
  if (usernameHasTaken) {
    return res.status(400).json({ message: "Username already taken" });
  }
  // Generate a random userId with 12 characters
  const uuid = await generateRandomString();
  // Hash the password
  const hashpass = await bcrypt.hash(password, 10);

  try {
    let user = await prisma.user.create({
      data: {
        username: username,
        name: name,
        email: email,
        password: hashpass,
        userId: uuid,
      },
    });
    res.status(201).json({ message: "successful", data: [user] });
  } catch (error) {
    next(error);
  }
};

exports.checkToken = async function (req, res, next) {
  return res.status(200).json({ message: "successful" });
};
