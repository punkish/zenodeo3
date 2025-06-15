// https://www.calculators.org/math/html-punctuation.php

const punctuations = {
    replaceWithSpace: [
        /* percent           */ '%',
        /* colon             */ ':',
        /* semicolon         */ ';',
        /* comma             */ ',', 
        /* period            */ '\\.', 
        /* dash              */ '-',
        /* m-dash            */ ' — ', 
        /* n-dash            */ '–',
        /* m-dash            */ '—',
        /* n-dash            */ '_',
        /* underscore        */ '_',
        /* close doublequote */ '"',
        /* open doublequote  */ '“',
        /* exclamation       */ '!', 
        /* slash             */ '\/',
        /* newline           */ '\\n',
        /* question          */ '\\?', 
        /* open paren        */ '\\(', 
        /* close paren       */ '\\)', 
        /* open curly        */ '\\{', 
        /* close curly       */ '\\}', 
        /* open square       */ '\\[', 
        /* close square      */ '\\]',
        /* asterisk          */ '\\*',
        /* hash              */ '#',
        /* at                */ '@',
        /* dollar            */ '$',
        /* numbers           */ '[0-9]'
    ],

    remove: [
        /* apostrophe */ '’', 
    ]
}

const replaceWithSpace = new RegExp(
    punctuations.replaceWithSpace.join('|'), 'g'
);

const remove = new RegExp(
    punctuations.remove.join('|'), 'g'
);

export { replaceWithSpace, remove }