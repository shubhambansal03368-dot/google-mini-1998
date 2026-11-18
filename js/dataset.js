/**
 * dataset.js - Mini Google 1998 Dataset
 * Exact 6-page dataset as specified:
 * 
 * ID | URL                      | Text                                                         | Links To
 * 1  | pune-food-guide.com      | Where to eat in Pune - vada pav and biryani and pizza        | 2
 * 2  | best-pizza-pune.com      | Fresh wood-fired pizza made daily - try our cheese pizza     | 1, 3
 * 3  | college-canteen-blog.com | Student reviews of canteen food and chai and Friday pizza    | 2, 4
 * 4  | pizza-recipes-home.com   | Make pizza at home - pizza dough and pizza sauce             | 2, 5
 * 5  | cheap-eats-pune.com      | Good food under 100 rupees - misal and dosa and pizza slices | 2
 * 6  | pizza-pizza-pizza.com    | pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza  | 1
 */

const RAW_DATASET = [
  {
    id: 1,
    url: "pune-food-guide.com",
    title: "Pune Food Guide - Best Places to Eat in Pune",
    text: "Where to eat in Pune - vada pav and biryani and pizza",
    linksTo: [2],
    description: "A comprehensive local guide to street food, restaurants, and eateries across Pune."
  },
  {
    id: 2,
    url: "best-pizza-pune.com",
    title: "Best Pizza in Pune - Authentic Italian Wood-Fired Pizzeria",
    text: "Fresh wood-fired pizza made daily - try our cheese pizza",
    linksTo: [1, 3],
    description: "Award-winning artisanal pizzeria crafting traditional wood-fired pizzas in Pune."
  },
  {
    id: 3,
    url: "college-canteen-blog.com",
    title: "College Canteen Chronicles - Pune Student Eats",
    text: "Student reviews of canteen food and chai and Friday pizza",
    linksTo: [2, 4],
    description: "Campus lifestyle blog rating budget food, tea spots, and Friday canteen specials."
  },
  {
    id: 4,
    url: "pizza-recipes-home.com",
    title: "Homemade Pizza Recipes & Dough Secrets",
    text: "Make pizza at home - pizza dough and pizza sauce",
    linksTo: [2, 5],
    description: "Step-by-step masterclasses on crafting fermented pizza dough and slow-simmered sauces."
  },
  {
    id: 5,
    url: "cheap-eats-pune.com",
    title: "Pune Cheap Eats Under Rs. 100",
    text: "Good food under 100 rupees - misal and dosa and pizza slices",
    linksTo: [2],
    description: "Budget foodie directory covering spicy misal pav, crispy dosas, and affordable pizza."
  },
  {
    id: 6,
    url: "pizza-pizza-pizza.com",
    title: "Pizza Pizza Pizza - Buy Pizza Online",
    text: "pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza",
    linksTo: [1],
    description: "Classic 1990s spam webpage packed with repeated keywords to manipulate search engines."
  }
];

// Helper to get dataset with computed incoming links and topology
function getDataset() {
  // Deep clone to ensure immutability of the source dataset
  const dataset = JSON.parse(JSON.stringify(RAW_DATASET));

  // Compute incoming links (who links to this page)
  dataset.forEach(page => {
    page.incomingLinks = [];
  });

  dataset.forEach(page => {
    page.linksTo.forEach(targetId => {
      const targetPage = dataset.find(p => p.id === targetId);
      if (targetPage && !targetPage.incomingLinks.includes(page.id)) {
        targetPage.incomingLinks.push(page.id);
      }
    });
  });

  return dataset;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RAW_DATASET, getDataset };
}
