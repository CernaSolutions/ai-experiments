gs.include('Bayes');

var classifier = new BayesMultiClassifier();
classifier.addContext('category');
classifier.teachDoc('software', 'my email is broken', 'category');
classifier.teachDoc('software', 'outlook wont work', 'category');
classifier.teachDoc('software', 'email is no longer coming in', 'category');
classifier.teachDoc('hardware', 'my laptop wont start', 'category');
classifier.teachDoc('hardware', 'keyfob doesnt work', 'category');
classifier.teachDoc('hardware', 'printer is jammed', 'category');

gs.info(JSON.stringify(classifier.guess('cant check email', 'category')));

/**
 * gs.include('Bayes');
 * 
 * var bayes = new Bayes();
 * 
 * bayes.teachAs('yes','outlook sunny');
 * bayes.teachAs('yes','outlook overcast');
 * bayes.teachAs('no','outlook rain');
 * 
 * bayes.teachAs('no','humidity high');
 * bayes.teachAs('yes','humidity low');
 * 
 * bayes.teachAs('no','light wind');
 * bayes.teachAs('yes','strong wind');
 * 
 * gs.info(JSON.stringify(bayes.guess('outlook overcast humidity low')))
 */