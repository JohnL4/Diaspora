Diaspora
========

Diaspora tools

cluster-gen
-----------

```
usage: cluster-gen.py [-h] [--legend] ...

Diaspora cluster generator

positional arguments:
  systemNames  Unique first letters of star system names

optional arguments:
  -h, --help   show this help message and exit
  --legend     Include a legend of colors in the generated graph
```

A Python 3 script.

Get Python at http://python.org.

The output (captured from `stdout` with a redirect) is intended for
processing with GraphViz (specifically, `neato`).

Get GraphViz at http://graphviz.org.

Sample command-line usage (I used CygWin (http://cygwin.org), but
regular Windows should work, too.

    python3 cluster-gen.py A B C D E F > sample-cluster.dot
    /usr/local/GraphViz-2.30.1/bin/neato.exe -Tpdf -osample-cluster.pdf sample-cluster.dot

Then you have a PDF file you can view.

You can edit the `.dot` file (it's just text) and comment out (using
`//`) the "legend".

Or, if you want a PNG:

    /usr/local/GraphViz-2.30.1/bin/neato.exe -Tpng -osample-cluster-no-legend.png sample-cluster-no-legend.dot
