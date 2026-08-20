const products = require("../data/products.json");

module.exports = (req, res) => {
  const disponibili = products.filter((p) => p.disponibile);
  return res.status(200).json(disponibili);
};
