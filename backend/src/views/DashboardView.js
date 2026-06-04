function toJson(data) {
  return data;
}

function toError(message) {
  return { error: message };
}

module.exports = { toJson, toError };
