const Config = require('../models/Config');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const getConfigs = asyncHandler(async (req, res) => {
  const configs = await Config.find({ group: req.query.group || { $exists: true } });
  
  // Transform to key-value object for easier frontend consumption
  const configMap = {};
  configs.forEach(c => {
    configMap[c.key] = c.value;
  });

  new ApiResponse(200, 'Configs fetched', configMap).send(res);
});

const updateConfigs = asyncHandler(async (req, res) => {
  const updates = req.body; // { key: value, ... }
  
  const promises = Object.keys(updates).map(key => 
    Config.findOneAndUpdate(
      { key },
      { value: updates[key] },
      { upsert: true, new: true }
    )
  );

  await Promise.all(promises);
  new ApiResponse(200, 'Configs updated').send(res);
});

module.exports = { getConfigs, updateConfigs };
