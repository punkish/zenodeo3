import tap from 'tap';
import { datetime } from './datetime.js';

const tests = [
    {
        input: { 
            col: {
                name: 'publicationDate', 
                where: 'treatments.publicationDate'
            }, 
            val: {
                date: 'yesterday'
            },
            operator: '>='
        },
        wanted: {
            constraint: "Unixepoch(treatments.publicationDate) >= Unixepoch(@publicationDate)",
            runparams: {
                publicationDate: '2024-05-04'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'publicationDate', 
                where: 'treatments.publicationDate'
            }, 
            val: {
                date: 'yesterday'
            },
            operator: '<='
        },
        wanted: {
            constraint: "Unixepoch(treatments.publicationDate) <= Unixepoch(@publicationDate)",
            runparams: {
                publicationDate: '2024-05-04'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'publicationDate', 
                where: 'treatments.publicationDate'
            }, 
            val: {
                date: 'yesterday'
            },
            operator: '='
        },
        wanted: {
            constraint: "Unixepoch(treatments.publicationDate) = Unixepoch(@publicationDate)",
            runparams: {
                publicationDate: '2024-05-04'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'publicationDate', 
                where: 'treatments.publicationDate'
            }, 
            val: {
                date: '2008-09-12'
            },
            operator: '>='
        },
        wanted: {
            constraint: "Unixepoch(treatments.publicationDate) >= Unixepoch(@publicationDate)",
            runparams: {
                publicationDate: '2008-09-12'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'publicationDate', 
                where: 'treatments.publicationDate'
            },
            val: {
                date: '2008-09-12' 
            },
            operator: '<='
        },
        wanted: {
            constraint: "Unixepoch(treatments.publicationDate) <= Unixepoch(@publicationDate)",
            runparams: {
                publicationDate: '2008-09-12'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'publicationDate', 
                where: 'treatments.publicationDate'
            },
            val: {
                date: '2008-09-12' 
            },
            operator: '='
        },
        wanted: {
            constraint: "Unixepoch(treatments.publicationDate) = Unixepoch(@publicationDate)",
            runparams: {
                publicationDate: '2008-09-12'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'publicationDate', 
                where: 'treatments.publicationDate'
            },
            val: {
                from: '2008-03-12',
                to: '2009-09-01'
            },
            operator: 'between'
        },
        wanted: {
            constraint: "Unixepoch(treatments.publicationDate) BETWEEN Unixepoch(@from) AND Unixepoch(@to)",
            runparams: {
                from: '2008-03-12',
                to: '2009-09-01'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'checkinTime', 
                where: 'treatments.checkinTime'
            }, 
            val: {
                date: 'yesterday'
            },
            operator: '>='
        },
        wanted: {
            constraint: "treatments.checkinTime >= Unixepoch(@checkinTime) * 1000",
            runparams: {
                checkinTime: '2024-05-04'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'checkinTime', 
                where: 'treatments.checkinTime'
            }, 
            val: {
                date: 'yesterday'
            },
            operator: '<='
        },
        wanted: {
            constraint: "treatments.checkinTime <= Unixepoch(@checkinTime) * 1000",
            runparams: {
                checkinTime: '2024-05-04'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'checkinTime', 
                where: 'treatments.checkinTime'
            }, 
            val: {
                date: 'yesterday'
            },
            operator: '='
        },
        wanted: {
            constraint: "treatments.checkinTime = Unixepoch(@checkinTime) * 1000",
            runparams: {
                checkinTime: '2024-05-04'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'checkinTime', 
                where: 'treatments.checkinTime'
            }, 
            val: {
                date: '2008-09-12'
            },
            operator: '>='
        },
        wanted: {
            constraint: "treatments.checkinTime >= Unixepoch(@checkinTime) * 1000",
            runparams: {
                checkinTime: '2008-09-12'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'checkinTime', 
                where: 'treatments.checkinTime'
            },
            val: {
                date: '2008-09-12' 
            },
            operator: '<='
        },
        wanted: {
            constraint: "treatments.checkinTime <= Unixepoch(@checkinTime) * 1000",
            runparams: {
                checkinTime: '2008-09-12'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'checkinTime', 
                where: 'treatments.checkinTime'
            },
            val: {
                date: '2008-09-12' 
            },
            operator: '='
        },
        wanted: {
            constraint: "treatments.checkinTime = Unixepoch(@checkinTime) * 1000",
            runparams: {
                checkinTime: '2008-09-12'
            }
        }
    },
    {
        input: { 
            col: {
                name: 'checkinTime', 
                where: 'treatments.checkinTime'
            },
            val: {
                from: '2008-03-12',
                to: '2009-09-01'
            },
            operator: 'between'
        },
        wanted: {
            constraint: "treatments.checkinTime BETWEEN Unixepoch(@from) * 1000 AND Unixepoch(@to) * 1000",
            runparams: {
                from: '2008-03-12',
                to: '2009-09-01'
            }
        }
    },
    {
        input: {
            col: {
                name: 'journalYear', 
                where: 'treatments.journalYear'
            },
            val: {
                date: '2008'
            },
            operator: '>='
        },
        wanted: {
            constraint: 'treatments.journalYear >= @journalYear',
            runparams: { journalYear: 2008 }
          }
    },
    {
        input: {
            col: {
                name: 'journalYear', 
                where: 'treatments.journalYear'
            },
            val: {
                date: '2008'
            },
            operator: '<='
        },
        wanted: {
            constraint: 'treatments.journalYear <= @journalYear',
            runparams: { journalYear: 2008 }
          }
    },
    {
        input: {
            col: {
                name: 'journalYear', 
                where: 'treatments.journalYear'
            },
            val: {
                date: '2008'
            },
            operator: '='
        },
        wanted: {
            constraint: 'treatments.journalYear = @journalYear',
            runparams: { journalYear: 2008 }
          }
    },
    {
        input: { 
            col: {
                name: 'journalYear', 
                where: 'treatments.journalYear'
            },
            val: {
                from: '2008',
                to: '2009'
            },
            operator: 'between'
        },
        wanted: {
            constraint: "treatments.journalYear BETWEEN @from AND @to",
            runparams: {
                from: 2008,
                to: 2009
            }
        }
    }
];

tap.test('dates', tap => {
    tests.forEach(test => {
        const found = datetime(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});