const router = require("express").Router();
const UserController = require("../controllers/user.controller");
const AuthController = require("../controllers/auth.controller");
const permission = require("../middleware/checkPermission.middleware");
const {
  ensureAuthenticated,
} = require("../middleware/ensureAuthenticated.middleware");

// ! Users routes
router.get(
  "/allUsers",
  ensureAuthenticated,
  permission(["ADMIN"]),
  UserController.getAllUsers
);

router.post("/users", UserController.addUser);

router.get("/check-token", ensureAuthenticated, UserController.checkToken);

//! Auth routes
router.post("/login", AuthController.login);

module.exports = router;
