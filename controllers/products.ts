import prisma from "../prisma/client";
import asyncHandler from "../middlewares/asyncHandler";
import {
  checkRequiredFields,
  filteredQty,
  isIntegerAndPositive,
  orderedQuery,
  ProductSelectType,
  selectAllProductField,
  selectedQuery,
} from "../utils/helperFunctions";
import { Prisma } from ".prisma/client";
import ErrorResponse from "../utils/errorResponse";
import errorObj, {
  errObjType,
  errorTypes,
  invalidQuery,
  resource404Error,
} from "../utils/errorObject";
import { NextFunction, Request } from 'express';
import { equal } from "assert";
/**
 * Get all products
 * @route   GET /api/v1/products
 * @access  Public
 */


export const getProducts = asyncHandler(async (req, res, next) => {
  type FilteredType = { [key: string]: number };

  // requested queries
  const querySelect = req.query.select;
  const queryInclude = req.query.include;
  const queryOrderBy = req.query.order_by;
  const queryOffset = req.query.offset;
  const queryLimit = req.query.limit;
  const queryPrice = req.query.price;
  const queryStock = req.query.stock;
  const queryCategory = req.query.category;
  const querySearch = req.query.search; // New search query

  // init variables
  let select: Prisma.ProductSelect | ProductSelectType | undefined;
  let orderBy:
    | Prisma.Enumerable<Prisma.ProductOrderByWithAggregationInput>
    | undefined;
  let skip: number | undefined;
  let take: number | undefined;
  let price: FilteredType[] = [];
  let stock: FilteredType[] = [];
  let categoryId: number | undefined;

  // return error if include field is not tags or category
  if (queryInclude) {
    const includedFields = (queryInclude as string).split(",");
    let error = false;
    includedFields.forEach((field) => {
      if (field !== "tags" && field !== "category") {
        error = true;
      }
    });

    if (error) {
      return next(
        new ErrorResponse(
          {
            status: 400,
            type: errorTypes.badRequest,
            message: "include field is not correct",
          },
          400
        )
      );
    }
  }

  // handle select and include logic
  if (querySelect && !queryInclude) {
    select = selectedQuery(querySelect as string);
  } else if (querySelect && queryInclude) {
    const selectedFields = selectedQuery(querySelect as string);
    const includedFields = selectedQuery(queryInclude as string);
    select = {
      ...selectedFields,
      ...includedFields,
    };
  } else if (!querySelect && queryInclude) {
    const selectAll = selectAllProductField();
    const includedFields = selectedQuery(queryInclude as string);
    select = {
      ...selectAll,
      ...includedFields,
    };
  }

  // if order_by param is requested
  if (queryOrderBy) {
    orderBy = orderedQuery(queryOrderBy as string);
  }

  // if offset param is requested
  if (queryOffset) {
    skip = parseInt(queryOffset as string);
  }

  // if limit param is requested
  if (queryLimit) {
    take = parseInt(queryLimit as string);
  }

  // error obj for price and stock
  const errObj: errObjType = {
    status: 400,
    type: errorTypes.badRequest,
    message: "same parameter cannot be more than twice",
  };

  // handle price filtering
  if (queryPrice) {
    if (typeof queryPrice !== "string" && (queryPrice as string[]).length > 2) {
      return next(new ErrorResponse(errObj, 400));
    }
    price = filteredQty(queryPrice as string | string[]);
  }

  // handle stock filtering
  if (queryStock) {
    if (typeof queryStock !== "string" && (queryStock as string[]).length > 2) {
      return next(new ErrorResponse(errObj, 400));
    }
    stock = filteredQty(queryStock as string | string[]);
  }

  // handle category filtering
  if (queryCategory) {
    const category = await prisma.category.findUnique({
      where: { name: queryCategory as string },
    });
    if (!category) {
      return next(new ErrorResponse(resource404Error("category"), 404));
    }
    categoryId = category.id;
  }
 

  // modify the Prisma query to filter prices less than or greater than the provided values
  const products = await prisma.product.findMany({
    select,
    orderBy,
    skip,
    take,
    where: {
      AND: [
        {
          price: {
            ...(price[0]?.lt && { lt: price[0].lt }), // if client asks for less than
            ...(price[0]?.gt && { gt: price[0].gt }), // if client asks for greater than
            ...(price[0]?.lte && { lte: price[0].lte }), // for less than or equal
            ...(price[0]?.gte && { gte: price[0].gte }), // for greater than or equal
          },
        },
        {
          stock: {
            ...(stock[0]?.lt && { lt: stock[0].lt }),
            ...(stock[0]?.gt && { gt: stock[0].gt }),
            ...(stock[0]?.lte && { lte: stock[0].lte }),
            ...(stock[0]?.gte && { gte: stock[0].gte }),
          },
        },
      ],
      categoryId: categoryId ? { equals: categoryId } : undefined,
      name: querySearch as string ? { contains: querySearch as string } : undefined,

    },
  });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});
 

// get fetured products
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  type FilteredType = { [key: string]: number };

  // requested queries
  const querySelect = req.query.select;
  const queryInclude = req.query.include;
  const queryOrderBy = req.query.order_by;
  const queryOffset = req.query.offset;
  const queryLimit = req.query.limit;
  const queryPrice = req.query.price;
  const queryStock = req.query.stock;
  const queryCategory = req.query.category;

  // init variables
  let select: Prisma.ProductSelect | ProductSelectType | undefined;
  let orderBy:
    | Prisma.Enumerable<Prisma.ProductOrderByWithAggregationInput>
    | undefined;
  let skip: number | undefined;
  let take: number | undefined;
  let price: FilteredType[] = [];
  let stock: FilteredType[] = [];
  let categoryId: number | undefined;

  // return error if include field is not tags or category
  if (queryInclude) {
    const includedFields = (queryInclude as string).split(",");
    let error = false;
    includedFields.forEach((field) => {
      if (field !== "tags" && field !== "category") {
        error = true;
      }
    });

    if (error) {
      return next(
        new ErrorResponse(
          {
            status: 400,
            type: errorTypes.badRequest,
            message: "include field is not correct",
          },
          400
        )
      );
    }
  }

  // handle select and include logic
  if (querySelect && !queryInclude) {
    select = selectedQuery(querySelect as string);
  } else if (querySelect && queryInclude) {
    const selectedFields = selectedQuery(querySelect as string);
    const includedFields = selectedQuery(queryInclude as string);
    select = {
      ...selectedFields,
      ...includedFields,
    };
  } else if (!querySelect && queryInclude) {
    const selectAll = selectAllProductField();
    const includedFields = selectedQuery(queryInclude as string);
    select = {
      ...selectAll,
      ...includedFields,
    };
  }

  // if order_by param is requested
  if (queryOrderBy) {
    orderBy = orderedQuery(queryOrderBy as string);
  }

  // if offset param is requested
  if (queryOffset) {
    skip = parseInt(queryOffset as string);
  }

  // if limit param is requested
  if (queryLimit) {
    take = parseInt(queryLimit as string);
  }

  // error obj for price and stock
  const errObj: errObjType = {
    status: 400,
    type: errorTypes.badRequest,
    message: "same parameter cannot be more than twice",
  };

  // handle price filtering
  if (queryPrice) {
    if (typeof queryPrice !== "string" && (queryPrice as string[]).length > 2) {
      return next(new ErrorResponse(errObj, 400));
    }
    price = filteredQty(queryPrice as string | string[]);
  }

  // handle stock filtering
  if (queryStock) {
    if (typeof queryStock !== "string" && (queryStock as string[]).length > 2) {
      return next(new ErrorResponse(errObj, 400));
    }
    stock = filteredQty(queryStock as string | string[]);
  }

  // handle category filtering
  if (queryCategory) {
    const category = await prisma.category.findUnique({
      where: { name: queryCategory as string },
    });
    if (!category) {
      return next(new ErrorResponse(resource404Error("category"), 404));
    }
    categoryId = category.id;
  }

  // modify the Prisma query to filter prices less than or greater than the provided values
  const products = await prisma.product.findMany({
    select,
    orderBy,
    skip,
    take,
    where: {
      AND: [
        {
          price: {
            ...(price[0]?.lt && { lt: price[0].lt }), // if client asks for less than
            ...(price[0]?.gt && { gt: price[0].gt }), // if client asks for greater than
            ...(price[0]?.lte && { lte: price[0].lte }), // for less than or equal
            ...(price[0]?.gte && { gte: price[0].gte }), // for greater than or equal
          },
        },
        {
          stock: {
            ...(stock[0]?.lt && { lt: stock[0].lt }),
            ...(stock[0]?.gt && { gt: stock[0].gt }),
            ...(stock[0]?.lte && { lte: stock[0].lte }),
            ...(stock[0]?.gte && { gte: stock[0].gte }),
          },
        },
      ],
      categoryId: categoryId ? { equals: categoryId } : undefined,
      featured:1
    },
  });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

/**
 * Get product count
 * @route   GET /api/v1/products
 * @access  Public
 */
export const getProductCount = asyncHandler(async (req, res, next) => {
  // requested queries
  const queryCategory = req.query.category;

  let categoryId: number | undefined;
  if (queryCategory) {
    const category = await prisma.category.findUnique({
      where: { name: queryCategory as string },
    });
    if (!category) {
      return next(new ErrorResponse(resource404Error("category"), 404));
    }
    categoryId = category.id;
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: {
        equals: categoryId,
      },
    },
  });

  res.status(200).json({
    success: true,
    count: products.length,
  });
});

/**
 * Search products
 * @route   GET /api/v1/products/search
 * @access  Public
 */
/**
 * Search products
 * @route   GET /api/v1/products/search
 * @access  Public
 */
export const searchProducts = asyncHandler(async (req, res, next) => {
  const querySearch = req.query.q;

  // Handle search functionality without `mode: 'insensitive'`
  const search = querySearch ? querySearch.toString().toLowerCase() : "";

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
        { detail: { contains: search } },
      ],
    },
  });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});


/**
 * Get specific products
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
export const getProduct = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);
  const queryInclude = req.query.include;
  let include: Object | undefined;

  if (queryInclude === "category") {
    include = { category: true };
  }

  // return error if include is specified and
  // include value is not "category"
  if (queryInclude && queryInclude !== "category") {
    return next(new ErrorResponse(invalidQuery, 400));
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include,
  });

  // throws error if no product with that id found
  if (!product) {
    return next(new ErrorResponse(resource404Error("product"), 404));
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * Create new product
 * @route   POST /api/v1/products
 * @access  Private
 */
// Define a type for req.files
 

export const createProduct = asyncHandler(async (req: any, res, next) => {
  // Destructure fields from request body
  const { name, price, description, discountPercent, detail, categoryId, stock } = req.body;

  // Access uploaded image files from req.files
  const image1 = (req.files as { [fieldname: string]: Express.Multer.File[] }).image1?.[0]?.filename; // Filename for the first image
  const image2 = (req.files as { [fieldname: string]: Express.Multer.File[] }).image2?.[0]?.filename; // Filename for the second image

  // Debugging: log the filenames to ensure they are being accessed correctly
  console.log("Image 1 Filename:", image1);
  console.log("Image 2 Filename:", image2);

  // Validate required fields
  const requiredFields = { name, price, description, image1, image2 };
  const hasError = checkRequiredFields(requiredFields, next);
  if (hasError !== false) return hasError;

  // Validate price
  if (!parseFloat(price) || parseFloat(price) < 0) {
    return next(new ErrorResponse('Invalid price' as any, 400));
  }

  // Validate stock if provided
  let parsedStock: number | null = null;
  if (stock) {
    if (!isIntegerAndPositive(stock)) {
      return next(new ErrorResponse('Invalid stock value' as any, 400));
    }
    parsedStock = parseInt(stock);
  }

  // Validate and parse categoryId if provided
  let parsedCategoryId: number | null = null;
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    });
    if (!category) {
      return next(new ErrorResponse(`Invalid category ID: ${categoryId}` as any, 400));
    }
    parsedCategoryId = parseInt(categoryId);
  }

  // Create product in the database
  const product = await prisma.product.create({
    data: {
      name,
      price: parseFloat(price),
      discountPercent,
      description,
      detail,
      category: {
        connect: { id: parsedCategoryId as any},
      },
      image1, // Filename of the first uploaded image
      image2, // Filename of the second uploaded image
      stock: parsedStock,
    }
  });

  // Send success response with the newly created product
  res.status(201).json({
    success: true,
    data: product,
  });
});

/**
 * Update a product
 * @route   PUT /api/v1/products/:id
 * @access  Private
 */
export const updateProduct = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);

  let {
    name,
    price,
    discountPercent,
    description,
    detail,
    categoryId,
    image1,
    image2,
    stock,
  } = req.body;

  // Throws error if price field is not number
  if (price) {
    if (!parseFloat(price) || parseFloat(price) < 0) {
      return next(new ErrorResponse(invalidPriceError, 400));
    }
    price = parseFloat(price);
  }

  // Throws error if stock field is not integer
  if (stock) {
    if (!isIntegerAndPositive(stock)) {
      return next(new ErrorResponse(invalidStockError, 400));
    }
    stock = parseInt(stock);
  }

  // Throws error if categoryId is invalid
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
    });
    if (!category) {
      return next(new ErrorResponse(invalidCategoryError(categoryId), 400));
    }
    categoryId = parseInt(categoryId);
  }

  if (discountPercent) {
    discountPercent = parseFloat(discountPercent);
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: name ? name : existingProduct?.name,
      price: price ? price : existingProduct?.price,
      discountPercent: discountPercent
        ? discountPercent
        : existingProduct?.discountPercent,
      description: description ? description : existingProduct?.description,
      detail: detail ? detail : existingProduct?.detail,
      category: {
        connect: {
          id: categoryId ? categoryId : existingProduct?.categoryId,
        },
      },
      image1: image1 ? image1 : existingProduct?.image1,
      image2: image2 ? image2 : existingProduct?.image2,
      stock: stock ? stock : existingProduct?.stock,
      updatedAt: new Date().toISOString(),
    },
  });

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * Delete a product
 * @route   DELETE /api/v1/products/:id
 * @access  Private
 */
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);
 console.log(id);

  await prisma.product.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    data: [],
  });
});


export const updateStatus = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);
  const {enabled}=req.body;
  console.log(req.body);
  await prisma.product.update({
    where: {
      id: id
    },
    data: {
      featured:enabled ? 1:0
    }
  });

  res.status(200).json({
    success: true,
    data: [],
  });
});
/*========================= Errors =============================*/
const invalidPriceError = errorObj(
  400,
  errorTypes.invalidArgument,
  "invalid price field",
  [
    {
      code: "invalidPrice",
      message: `price field must only be valid number`,
    },
  ]
);

const invalidStockError = errorObj(
  400,
  errorTypes.invalidArgument,
  "invalid stock field",
  [
    {
      code: "invalidStock",
      message: `stock field must only be valid integer`,
    },
  ]
);

const invalidCategoryError = (categoryId: string) =>
  errorObj(400, errorTypes.invalidArgument, "invalid category id", [
    {
      code: "invalidCategory",
      message: `there is no category with id ${categoryId}`,
    },
  ]);
