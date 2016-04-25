import re

f = open("list.js", "r")
n = open("newlist.js", "w")
n.write("var trackerList = [\n");

regex = '\|\|.+\^'
for line in f:
	line = line.rstrip('\n')
	address = re.match(regex, line)

	if not address:
		continue
	print address.group(0)
	newline = "\t\"*://*." + address.group(0).lstrip('\|\|').rstrip('\^') + "/*\",\n"
	n.write(newline)
n.write("]")
