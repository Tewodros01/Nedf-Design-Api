import crypto from "crypto";
import asyncHandler from "../middlewares/asyncHandler";
import prisma from "../prisma/client";
import {
  checkRequiredFields,
  comparePassword,
  generateResetPwdToken,
  generateToken,
  hashPassword,
  validateEmail,
} from "../utils/helperFunctions";
import ErrorResponse from "../utils/errorResponse";
import errorObj, {
  defaultError,
  errorTypes,
  expireTokenError,
  incorrectCredentialsError,
  invalidEmail,
  invalidTokenError,
} from "../utils/errorObject";
import { ExtendedRequest } from "../utils/extendedRequest";
import sendMail from "../utils/sendEmail";

/**
 * Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registeruser = asyncHandler(async (req, res, next) => {
  const email: string = req.body.email;
  const fullname: string = req.body.fullname;
  let password: string = req.body.password;
  const shippingAddress: string = req.body.shippingAddress;
  const phone: string = req.body.phone; // null
// const {data}=req.body;
  // Check required fields
  const requiredFields = { email, fullname, password };
  const hasError = checkRequiredFields(requiredFields, next);
  if (hasError !== false) return hasError;

  // Validate email
  if (!validateEmail(email)) {
    const emailError = errorObj(
      400,
      errorTypes.invalidArgument,
      "email is not valid"
    );
    return next(new ErrorResponse(emailError, 400));
  }

  // Hash password
  password = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      fullname,
      password,
      shippingAddress,
      phone,
    },
  });

  const token = generateToken(user.id, user.email);

  res.status(201).json({
    success: true,
    user: user,
    token: token,
  });
});

/**
 * Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginuser = asyncHandler(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // Check required fields
  const requiredFields = { email, password };
  const hasError = checkRequiredFields(requiredFields, next);
  if (hasError !== false) return hasError;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Throws error if user does not exist
  if (!user) {
    return next(new ErrorResponse(incorrectCredentialsError, 401));
  }

  // Check pwd with hashed pwd stored in db
  const result = await comparePassword(password, user.password);

  // Throws error if password is incorrect
  if (!result) {
    return next(new ErrorResponse(incorrectCredentialsError, 401));
  }

  const token = generateToken(user.id, user.email);

  res.status(200).json({
    success: true,
    token: token,
    data: {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      shippingAddress: user.shippingAddress,
      phone: user.phone,
      role:user.role
    },
  });
});

/**
 * Get current logged-in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: ExtendedRequest, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req!.user!.id },
    select: {
      id: true,
      fullname: true,
      email: true,
      shippingAddress: true,
      phone: true,
    },
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Update user Details (self)
 * @route   PUT /api/v1/auth/update-details
 * @access  Private
 */
export const updateuserSelf = asyncHandler(
  async (req: ExtendedRequest, res, next) => {
    const fullname: string | undefined = req.body.fullname;
    const shippingAddress: string | undefined = req.body.shippingAddress;
    const phone: string | undefined = req.body.phone;
    const email: string | undefined = req.body.email;

    // Throws error if email is invalid
    if (email && !validateEmail(email)) {
      return next(new ErrorResponse(invalidEmail, 400));
    }

    const updateduser = await prisma.user.update({
      where: { id: req!.user!.id },
      data: {
        fullname,
        email,
        shippingAddress,
        phone,
        updatedAt: new Date().toISOString(),
      },
      select: {
        fullname: true,
        email: true,
        shippingAddress: true,
        phone: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updateduser,
    });
  }
);

/**
 * Update user Password (self)
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(
  async (req: ExtendedRequest, res, next) => {
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    // Check required fields
    const requiredFields = { currentPassword, newPassword };
    const hasError = checkRequiredFields(requiredFields, next);
    if (hasError !== false) return hasError;

    // Check current password is correct
    const correctPassword = await comparePassword(
      currentPassword,
      req!.user!.password
    );

    // Throws error if current password is incorrect
    if (!correctPassword)
      return next(
        new ErrorResponse(
          {
            ...incorrectCredentialsError,
            message: "current password is incorrect",
          },
          401
        )
      );

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req!.user!.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: "password has been updated",
    });
  }
);

/**
 * Forgot Password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const email: string | undefined = req.body.email;

  // Check if email include
  const hasError = checkRequiredFields({ email }, next);
  if (hasError !== false) return hasError;

  const [resetToken, resetPwdToken, resetPwdExpire] = generateResetPwdToken();

  // Save pwdToken and pwdExpire in the db
  const user = await prisma.user.update({
    where: { email },
    data: {
      resetPwdToken: resetPwdToken as string,
      resetPwdExpire: resetPwdExpire as number,
    },
  });

  // Create reset URL
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/reset-password/${resetToken}`;

  // Reset email message
  const message = `You are receiving this email because 
  you (or someone else) has requested the reset of a password. 
  Please make a PUT request to: \n\n ${resetURL}`;

  try {
    await sendMail({
      email: user.email,
      subject: "Password reset token (valid for 10min)",
      message,
    });
    res.status(200).json({
      success: true,
      message: "Email has been sent...",
    });
  } catch (err) {
    // Log error
    console.error(err);

    // Save user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPwdToken: null,
        resetPwdExpire: null,
      },
    });

    return next(new ErrorResponse(defaultError, 500));
  }
});

/**
 * Reset Password
 * @route   PUT /api/v1/auth/reset-password/:resetToken
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const resetToken = req.params.resetToken;
  const password = req.body.password;

  // Throws error if password not include
  const hasError = checkRequiredFields({ password }, next);
  if (hasError !== false) return hasError;

  const resetPwdToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await prisma.user.findUnique({
    where: { resetPwdToken },
  });

  // Throws error if token not found
  if (!user) return next(new ErrorResponse(invalidTokenError, 400));

  // Throws error if token is expired
  if ((user.resetPwdExpire as bigint) < Date.now()) {
    return next(new ErrorResponse(expireTokenError, 400));
  }

  const hashedPassword = await hashPassword(password);

  // Update password and token data
  await prisma.user.update({
    where: { resetPwdToken },
    data: {
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
      resetPwdToken: null,
      resetPwdExpire: null,
    },
  });

  res.status(200).json({
    success: true,
    message: "password has been reset",
  });
});
