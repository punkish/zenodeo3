# Zenodeo Query Help

Zenodeo is a REST API for treatments and related data. That means, all queries are performed via HTTP Requests, and the query result is returned as a JSON Response. Below is the anatomy of an HTTP Request:
    
```
http://test.zenodeo.org/v3/treatments?treatmentTitle=Ichneumonoidea
                           |________| |____________________________|->
                                |                     |
                             resource            query string
```

A few notes about the URL:

* the entire URL is case-sensitive. The **resource** name is all lowercase, query parameter `keys` use camelCase as appropriate, and query parameter `value` uses underscores ('_') where needed.
* the query *has* to be URL encoded. Browsers usually do this automatically, but if you are accessing the API programmatically, please URL Encode all params. Here is how to do it with `curl`

        $ curl -G -v "http://test.zenodeo.org/v3/treatments" \
        --data-urlencode "treatmentTitle=Ichneumonoidea" \
        --data-urlencode "publicationDate=since(2018-03-22)"

* it is possible to submit a query without any parameters, as shown below.  
  
        $ curl "http://test.zenodeo.org/v3/treatments"

* if a parameter is provided, it *has* to be a valid parameter. An invalid parameter will not be ignored; it will result in an error.
* if the query includes a &lt;resourceId&gt; (for example, `http://test.zenodeo.org/v3/treatments?treatmentId=0384B825FF91FF8A9AF8FDBBC56289BE`), then no additional parameter is required and will be ignored if provided.
* certain parameters (`page`, `size`, `cols`, `sortby`) have default values that will be used if the user doesn't provide them in the query.
* if `cols` is provided, only the specified "cols" will be returned. If a blank "cols" is specifically requested (use `cols=`) then only a "Count" query will be performed.

## Zenodeo Query Language (ZQL)

The Zenodeo Query Language is a simple `key=value` syntax usable in the browser query string. 

The `key` is usually a column in the database, but it could be a "concept", for example, `geolocation`, which gets converted into columns when quering the database on the server. The `key` is case-sensitive.

The `value` is a ZQL operator followed by the query term in parentheses. The ZQL operator itself is case-sensitive, but the query term inside the parens may or may not be case-sensitive. For example, when searching for a text string using `eq` (`authorityName=eq(Agosti)`), the case matters as an exact match is performed. But, other text operators are case-insensitive.

Below are examples of the currently supported queries (the text within "&lt;" and "&gt;" are replaced with the correct value):  

&lt;text field&gt;=eq|ne|starts\_with|ends\_with|contains(&lt;term&gt;)  
* `authorityName=starts_with(Donat)`  
* `authorityName=ends_with(Agosti)`  
* `authorityName=contains(gost)`  
* `authorityName=eq(Agosti)`
* `authorityName=ne(Agosti)` 

The following two are equivalent  
* `authorityName=starts_with(Donat)` 
* `authorityName=Agosti`

&lt;date field&gt;=since|until(&lt;date&gt;)  
* `publicationDate=since(2020-01-21)`
* `publicationDate=until(2020-01-21)`

&lt;date field&gt;=between(&lt;from-date&gt; and &lt;to-date&gt;)
* `publicationDate=between(2020-01-21 and 2020-10-13)`

geographic queries
* `geolocation=within({radius:100, units: 'kilometers', lat: 43.04, lng: -121.003})`
* `geolocation=contained_in({lower_left: {lat: 43.04, lng: -121.003}, upper_right: {lat: 43.04, lng: -121.003}})`
