# Cassava-flavored CSV

This is a standard that is a superset of csv. It is designed to be human-readable while also being more structured for computers. We accomplish this using an "enhanced header". Here's an example

```csv
0-cassava,name,birthday,age,notifications,color
0-type,string,date:YYYY-MM-DD,func:number,logical,select
0-default,,,"YEARS(NOW()-{birthday})",false,red|green|blue
0-avassac,name,birthday,age,notifications,color
1,Adam,1999-02-14,26,false,red
2,Beu,1977-01-13,48,true,blue
```

This might not play nice with type inference in a other csv tools like excel. You would have to cut off all the 0-columns (maybe keeping the last one as a header).

## Spec

If the first cell contains "0-cassava", then all the rows starting with 0 should be parsed as an enhanced multi-line header. The editor should just display the titles.

The first column corresponds to line numbers.

### Types

- logical is like a boolean type
- maybe is like a boolean type but nullable. (empty string)
- select is like an enum type
- multiselect is like a select[] and is recorded like `red;green`
