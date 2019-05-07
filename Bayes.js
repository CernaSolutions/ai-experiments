var COMMON_WORDS = ("the of an a to in is you that it he was for on are as with his they I " + "at be this have from or one had by word but not what all were we when your can said " + "there use an each which she do how their if will up other about out many then them these so " + "some her would make like him into time has look two more write go see number no way could people " + "my than first ZZwater been call who ZZoil its now find long down day did get come made may part " + "this and").split(" ");
var SYMBOLS = "!@#$%^&*()-+_=[]{}\\|;':\",.<>/?~`";
var VERY_UNLIKELY = 0.0001;
var USE_LOGS = true;

function Bayes() {}

Bayes.prototype = {
    constructor: Bayes,

    words: {},
    classes: {
        __length: 0
    },

    sanitize: function(wrd, cls) {
        if (wrd != null) {
            if (typeof this.words[wrd] == "undefined") this.words[wrd] = {
                __length: 0
            };
            if (typeof this.words[wrd][cls] == "undefined") this.words[wrd][cls] = 0;
        }

        if (typeof this.classes[cls] == "undefined") this.classes[cls] = {
            __length: 0
        };
        if (typeof this.classes[cls][wrd] == "undefined") this.classes[cls][wrd] = 0.01;
    },


    teachAs: function(classification, doc) {
        var tokens = this.scrub(doc);

        for (var i in tokens) {
            this.teach(tokens[i], classification);
        }

    },

    teach: function(wrd, cls) {
        this.sanitize(wrd, cls);
        this.words[wrd][cls]++;
        this.words[wrd].__length++;
        this.classes[cls][wrd]++;
        this.classes[cls].__length++;
        this.classes.__length++;
    },

    guess: function(doc) {
        var tokens = this.scrub(doc);
        var probs = new Array();
        var probSum = 0;

        for (var cls in this.classes) {
            if (cls == "__length") continue;
            var prob = this.probabilityOfClassGivenDocument(cls, tokens);
            probSum += prob;
            probs[probs.length] = {
                classification: cls,
                probability: prob,
                pc: this.probabilityOfClass(cls)
            };
        }

        var matchesPc = true;

        for (var i = 0; i < probs.length; i++) {

            if (USE_LOGS) {
                probs[i].probability = 1 / (1 + Math.pow(Math.E, probSum - 2 * probs[i].probability));
            } else if (probSum > 0) {
                probs[i].probability = probs[i].probability / probSum;
            }

            var ratio = probs[i].probability / probs[i].pc;
            if (ratio < 0.95 || ratio > 1.05) matchesPc = false;
        }

        if (matchesPc) {
            for (var i = 0; i < probs.length; i++) {
                probs[i].probability = 0;
            }
        }

        for (var i = 0; i < probs.length; i++) {
            probs[i].probability = probs[i].probability.toFixed(4);
        }

        probs.sort(function(a, b) {
            return b.probability - a.probability;
        });

        // var str = "";
        // for (var i = 0; i < probs.length; i++) {
        //     str += probs[i].classification + "(" + probs[i].probability + "),";
        // }
        return probs;
    },

    probabilityOfClassGivenDocument: function(cls, tokens) {
        var prob = 1;
        if (USE_LOGS) prob = 0;
        for (var i in tokens) {
            var p = this.probabilityOfWordGivenClass(tokens[i], cls);
            if (USE_LOGS) {
                prob += Math.log(p);
            } else {
                prob *= p;
            }
        }
        if (USE_LOGS) {
            prob += Math.log(this.probabilityOfClass(cls));

        } else {
            prob *= this.probabilityOfClass(cls);

        }
        return prob;
    },

    probabilityOfClass: function(cls) {
        this.sanitize(null, cls);
        var pc = this.classes[cls].__length / this.classes.__length;
        return pc;
    },

    // condtional probability. p(w|C).  probability a give word is classified as cls. uses empirical data.
    probabilityOfWordGivenClass: function(wrd, cls) {
        this.sanitize(wrd, cls);
        var prob = this.words[wrd][cls] / this.classes[cls].__length;
        // if a word has not been classified, don't use zero as the probability. It results in divide-by-zero later on.
        // instead, set it to an infinitesimal value indicating is very low probability. This skews the results, but not
        // too much.  This has the unfortunate side effect of introducing bogus probabilities when all tokens in a document
        // have never been seen before.  This unlikely event is handled later on when probabilities for all classes are
        // examined and ordered.
        if (prob == 0) return VERY_UNLIKELY; // infinitesimal probability.
        else return prob;
    },

    scrub: function(doc) {

        function strip_common_words(tokens) {
            var newTokens = new Array();
            var ntPos = 0;
            for (var i = 0; i < tokens.length; i++) {
                var common = false;
                for (var cw = 0; cw < COMMON_WORDS.length; cw++) {
                    if (COMMON_WORDS[cw] == tokens[i]) {
                        common = true;
                        break;
                    }
                }
                if (!common) newTokens[ntPos++] = tokens[i];
            }
            return newTokens;
        }

        function strip_non_chars(content) {
            var res = [];
            for (var i = 0; i < content.length; i++) {
                if (SYMBOLS.indexOf(content.charAt(i)) < 0) res.push(content[i]);
            }

            return res.join('');
        }

        var putty = new String(doc);

        putty = putty.toLowerCase();

        putty = strip_non_chars(putty); // remove punctuation, etc.

        putty = putty.replace(/\s+/g, ' '); // replace white space runs with a single 0x20.
        var tokens = putty.split(" ");
        tokens = strip_common_words(tokens);
        return tokens;
    },

    getMostLikelyCategory : function(doc){
        var probabilities = this.guess(doc);
        if(probabilities.length > 0){
            return probabilities[0].classification + " " + probabilities[0].probability + " " + probabilities[0].pc
        } else {
            return 'unknown'
        }
        
    }
};

function BayesMultiClassifier() {}

BayesMultiClassifier.prototype = {
    constructor: BayesMultiClassifier,
    contexts : {},

    addContext: function(context){
        this.contexts[context] = new Bayes();
    },

    teachDoc: function(classification, doc, context) {
        return this.contexts[context].teachAs(classification, doc);
    },

    guess : function(doc){
        var contextProbabilities = {};
        for(contextName in this.contexts){
            var context = this.contexts[contextName];
            contextProbabilities[contextName] = context.guess(doc);
        }

        return contextProbabilities;
    }
}