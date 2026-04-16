const { Category } = require('../models');

const defaultCategories = [
    { name: 'Formal Barong', description: 'Traditional Filipino formal wear for men (Piña, Jusi, Cocoon).' },
    { name: 'Polo Barong', description: 'Semi-formal and everyday business attire.' },
    { name: 'Modern Filipiniana', description: 'Contemporary takes on traditional women\'s dresses.' },
    { name: 'Traditional Gowns', description: 'Heritage formal gowns like Traje de Mestiza.' },
    { name: 'Heritage Accessories', description: 'Abaca bags, hand-painted fans, and native jewelry.' },
    { name: 'Lumban Specials', description: 'Hand-embroidered specialties from the Embroidery Capital.' },
    { name: 'Semi-Formal', description: 'Occasion-wear that balances heritage and modern comfort.' },
    { name: 'Others', description: 'Miscellaneous heritage crafts.' }
];

const initCategories = async () => {
    try {
        for (const cat of defaultCategories) {
            await Category.findOrCreate({
                where: { name: cat.name },
                defaults: cat
            });
        }
        console.log('Default categories initialized successfully.');
    } catch (error) {
        console.error('Error initializing categories:', error);
    }
};

module.exports = initCategories;
