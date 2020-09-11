# ZQL syntax

Two possibilities

```
param_$starts_with=<string>: @param LIKE '<string>%'
param_$ends_with=<string>: @param LIKE '%<string>'
param_$contains=<string>: @param LIKE '%<string>%'
q=<string>: @q MATCH <string> [^1]
param_$eq=<string>: = @param = '<string>'
param_$since=<date-string>: dateconvert(@param >= dateconvert('<string>')
param_$until=<date-string>: dateconvert(@param <= dateconvert('<string>')
param_$between=<date-string>: dateconvert(@param) >= dateconvert('<string1>') && dateconvert(@param) <= dateconvert('<string2>') [^2]
param_$gte=<number>: @param >= Cast('<string>' AS NUMERIC)
param_$lte=<number>: @param <= Cast('<string>' AS NUMERIC)
param_$gt=<number>: @param > Cast('<string>' AS NUMERIC)
param_$lt=<number>: @param < Cast('<string>' AS NUMERIC)
loc_$within=<number1 kms>,<number2 lat>,<number3 lng>

$col=default|all|<string1 col>,<string2 col>…
$size=<integer>: LIMIT @size default 30
$page=<integer>: OFFSET (@page - 1) default 1
$sortby=<colname>.<sortdir asc|desc>: ORDER BY <colname> <sortdir = 'asc' ? ASC : DESC> default resourceId ASC
$facets=<boolean>: default false
$stats=<boolean>: default false
$xml=<boolean>: default false
$refreshCache=<boolean>: default false
```

```
param=starts_with(<string>): @param LIKE '<string>%'
param=ends_with(<string>): @param LIKE '%<string>'
param=contains(<string>): @param LIKE '%<string>%'
q=<string>: @q MATCH <string> [^1]
param=<string>: = @param = '<string>'
param=since(<date-string>): dateconvert(@param >= dateconvert('<string>')
param=until(<date-string>): dateconvert(@param <= dateconvert('<string>')
param=between(<date-string1>-<date-string2>: dateconvert(@param) >= dateconvert('<string1>') && dateconvert(@param) <= dateconvert('<string2>') [^2]
param=gte(<number>): @param >= Cast('<string>' AS NUMERIC)
param=lte(<number>): @param <= Cast('<string>' AS NUMERIC)
param=gt(<number>): @param > Cast('<string>' AS NUMERIC)
param=lt(<number>): @param < Cast('<string>' AS NUMERIC)
loc=within(<number1 kms>,<number2 lat>,<number3 lng>)

col=default|all|<string1 col>,<string2 col>…
size=<integer>: LIMIT @size default 30
page=<integer>: OFFSET (@page - 1) default 1
sortby=<colname>.<sortdir asc|desc>: ORDER BY <colname> <sortdir = 'asc' ? ASC : DESC> default resourceId ASC
facets=<boolean>: default false
stats=<boolean>: default false
xml=<boolean>: default false
refreshCache=<boolean>: default false
```