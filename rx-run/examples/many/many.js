
var ManyUser = Cycle.createDOMUser('.js-container');

ManyUser.inject(ManyView).inject(ManyModel).inject(ManyIntent).inject(ManyUser);
