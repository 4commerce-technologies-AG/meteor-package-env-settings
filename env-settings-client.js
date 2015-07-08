// this helper allows to access values from Meteor.settings.public 
// within your templates
Template.registerHelper('MeteorSettingsPublic', function(elem) {
  // check content for given elements dot notation
  var elem_ = String(elem).trim();
  // empty so no result
  return (elem_ === "") ? "" : elem_.split('.').reduce(function(obj, index) { return obj[index] }, Meteor.settings.public);
});
