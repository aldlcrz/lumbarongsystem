const { Review, Product, Order, User } = require('../models');

exports.createReview = async (req, res, next) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const customerId = req.user.id;

    // Check if customer already reviewed this product for this order
    const existingReview = await Review.findOne({
      where: {
        productId,
        customerId,
        orderId
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product for this order.' });
    }

    const review = await Review.create({
      productId,
      customerId,
      orderId,
      rating,
      comment
    });

    // Optionally update product average rating here if needed
    // or compute it on the fly

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.findAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['name', 'profilePhoto']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

exports.getSellerReviews = async (req, res, next) => {
    try {
        const sellerId = req.params.sellerId;
        const reviews = await Review.findAll({
            include: [
                {
                    model: Product,
                    as: 'product',
                    where: { sellerId },
                    attributes: ['name', 'image']
                },
                {
                    model: User,
                    as: 'customer',
                    attributes: ['name', 'profilePhoto']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reviews);
    } catch (error) {
        next(error);
    }
};
