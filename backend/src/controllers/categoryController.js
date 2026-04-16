const { Category, Product } = require('../models');

exports.getCategories = async (req, res) => {
    try {
        const { tree } = req.query;
        
        if (tree === 'true') {
            const categories = await Category.findAll({
                where: { parentId: null },
                include: [{
                    model: Category,
                    as: 'children',
                    include: [{ model: Category, as: 'children' }] // 3 levels deep support
                }],
                order: [['name', 'ASC']]
            });
            return res.json(categories);
        }

        const categories = await Category.findAll({
            include: [{ model: Category, as: 'parent', attributes: ['id', 'name'] }],
            order: [['name', 'ASC']]
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id, {
            include: [
                { model: Category, as: 'parent' },
                { model: Category, as: 'children' }
            ]
        });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, parentId } = req.body;
        const existing = await Category.findOne({ where: { name } });
        if (existing) return res.status(400).json({ message: 'Category already exists' });

        const category = await Category.create({ name, description, parentId });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, description, parentId } = req.body;
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        await category.update({ name, description, parentId });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const hasChildren = await Category.count({ where: { parentId: category.id } });
        if (hasChildren > 0) {
            return res.status(400).json({ message: 'Cannot delete category with subcategories.' });
        }

        const { Op } = require('sequelize');
        const productCount = await Product.count({ where: { categories: { [Op.like]: `%${category.name}%` } } });
        if (productCount > 0) {
            return res.status(400).json({ message: `Cannot delete '${category.name}' because it contains ${productCount} active product(s). Remove them first.` });
        }

        await category.destroy();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
