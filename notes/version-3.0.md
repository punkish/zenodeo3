# Zenodeo version 3.0

These quieter days of July-August, I have been working on Zenodeo version 3.0. The next release of the API will have significant changes that will make it more powerful and flexible for developers. The general scheme will remain the same

```
┌────────┐┌─┐┌────────┐                   
│resource││?││query   │                   
└────────┘└─┘└────────┘                  
     │            │                     
     ▼            │                     
                  │                     
treatments        │                     
                  │                     
                  │                     
                  │                     
                  ▼                     
             key=value

// for example
https://zenodeo.org/treatements?querystring                       
```

A big enhancement in the new API will be a simple but effective query language that will be embeddable in the querystring. Here is an example (all subject to change between now and release)

```html
https://zenodeo.org/treatments?treatmentTitle_$starts=Carvalhoma&journalTitle_$ends=Taxonomy&publicationDate_$between=y2016m1d12-y2018m6d10&articleAuthor_$contains=Slater&$cols=treatmentId,zenodoDep,journalYear&$page=1&size=30&$sortby=journalYear_asc,zenodoDep_desc
```

1. Find all **treatments** where **treatmentTitle** begins with *Carvalhoma* and **journalTItle** ends with *Taxonomy* and **publicationDate** is between *Jan 12, 2016* and *Jun 10, 2018* and **articleAuthor** contains *Slater*
2. Select *treatmentId*, *zenodoDep* and *journalYear* for all the found rows 
3. Sort the rows by **journalYear** in *ascending* and then **zenodoDep** in *descending* order
4. Return the first 30 rows (*30* from *1*)

Notes: 

1. Keys or parts of keys starting with *$* are reserved terms by the Zenodeo API (SQL mavens will be very familiar with most of these terms)
2. All $start, $end, and $contains queries will be case-insensitive
3. Multiple **$sortby** column_direction pairs will be possible in a comma separated list

I will be publishing other details of the API as time goes by, but I wanted to get this one out right away so I can benefit from your collective insights, feelings, or concerns. Looking forawrd to your feedback.

## Full set of commands

```
param_$starts=<string>: @param LIKE '<string>%'
param_$ends=<string>: @param LIKE '%<string>'
param_$contains=<string>: @param LIKE '%<string>%'
q=<string>: @q MATCH <string> [^1]
param_$eq=<string>: = @param = '<string>'
param_$since=<string>: dateconvert(@param >= dateconvert('<string>')
param_$until=<string>: dateconvert(@param <= dateconvert('<string>')
param_$between=<string>: dateconvert(@param) >= dateconvert('<string1>') && dateconvert(@param) <= dateconvert('<string2>') [^2]
param_$gte=<string>: @param >= Cast('<string>' AS NUMERIC)
param_$lte=<string>: @param <= Cast('<string>' AS NUMERIC)
param_$gt=<string>: @param > Cast('<string>' AS NUMERIC)
param_$lt=<string>: @param < Cast('<string>' AS NUMERIC)
```

[1]: `q` is a special param that does a fulltext search against a special table
[2]: If `param` is a date field, then date comparion is used. If `param` is a number, then numeric comparison is used as follows `param_$between=<string>: @param >= Cast('<string>' AS NUMERIC) && @param <= Cast('<string>' AS NUMERIC)`