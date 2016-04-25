'''
@author:angad
'''
#originally by https://github.com/angad/webPriority


#converting to google regex which we need to filter for urls

import re, sys, glob, os

class EasyListParser():
    
    whitelist = []
    blacklist = []

    count = 0
    blank_count = 0

    call_count = 0
    # BLOODY REGEX FOR REGEX
    # !  - comments, ignore
    # #  - element hiding, ignore
    # @@ - whitelist
    # |  - begins with
    # || - begins with https?://w?w?w?\d?.?
    # ^(ends with) - ends with a separator (?, /, :)
    # replace . with \.
    # replace ? with \?

    COMMENT = re.compile(r"^!")
    HIDDEN = re.compile(r"\#")
    WHITELIST = re.compile(r"^@@")
    
    
    DOUBLEPIPE = re.compile(r"^\|\|")
    SINGLEPIPE = re.compile(r"^\|[^\|]")
    ENDPIPE = re.compile(r"\|$")
    ENDCARET = re.compile(r"\^$")
    QUESTIONMARK = re.compile(r"\?")
    DOT = re.compile(r"\.")
    BACKSLASH = re.compile(r"\\")
    FORWARDSSLASH = re.compile(r"/")
    CARET = re.compile(r"\^")
    CARETSTAR = re.compile(r"\^\*")
    ENDSTAR = re.compile(r"\*$")
    DOMAIN = re.compile(r"\|\|")
    EXACT = re.compile(r".*\|.*");
    
    
#    x = "^\(\^\(https\?:\/\/\)\?w\?w\?w\?\\d\?.?\)\?"
#    all = open("all_filters.txt", "w")


    # parse the filters from the given file name.
    # add the blacklisted urls to blacklist list.
    # this is really hackish :(

    def __init__(self):
        self.whitelist = []
        self.blacklist = []

    def parse_filter(self, filename):
        self.call_count += 1
        adFile = open(filename, "r")
        filters = adFile.readlines()
                
        for f in filters:

            if f.find('ad_channel') != -1:
                print filename
            self.count +=1
            #title
            if self.count == 1:
                continue
#            self.all.write(f)
            
            comments = re.match(self.COMMENT, f)
            hidden = re.search(self.HIDDEN, f)
            type = ""
            
            if hidden or comments:
                self.blank_count +=1
                type = "none"
                continue

            if "$" in f:
                f = f.split("$")[0] + '\n'

            f = f.rstrip("\\")
                
#            if ";" in f:
#                f = f.split(";")[0] + '\n'

                        
            # f = re.sub(self.DOT, "\.", f)
            # f = re.sub(self.QUESTIONMARK, "\?", f)
            #f = re.sub(self.CARETSTAR, r"\\\\?/?:?\.\*", f)
#            f = re.sub(self.ENDSTAR, "", f)
            #f = re.sub(self.ENDCARET, r"\\", f)
            # f = re.sub(self.ENDPIPE, "$", f)
            # f = re.sub(self.SINGLEPIPE, "^", f)
            # f = re.sub(self.DOUBLEPIPE, r"(^(https?://)?w?w?w?\d?\.?)?", f)
            
            whitelist = re.match(self.WHITELIST, f)
            domain = re.match(self.DOMAIN, f)
            exact = re.match(self.EXACT, f);

            if whitelist:
                self.whitelist.append(f)
                type = "whitelist"
#                self.all.write(type + ": " + f)
            elif domain:
                f = re.sub(self.ENDCARET, r"/*", f)
                f = re.sub(self.DOMAIN, r"*://*.", f)
                f = f.replace("|", "")
                self.blacklist.append(f)
                type = "blacklist"
#                self.all.write(type + ": " + f) 
            else:
                f = f.replace("|", "")
                f = re.sub(self.ENDCARET, r"*", f)
                if f.startswith('.'):
                    f = '*://*'+f
                else:
                    f = '*://*/*'+f

                self.blacklist.append(f)
                type = "unknown"

    

    def check_if_ad(self, url):

        # Whitelisting
#        for f in self.whitelist:
#            f = f[0:-1]
#            regex = re.compile(f)
#            r = regex.search(url)
#            if r:
#                print f
#                print "WhiteListed!"
#                return 0
        
        # Blacklisting
        for f in self.blacklist:
            f = f[0:-1]
#            print f
            regex = re.compile(f)
            r = regex.search(url)
            if r:
                print "BlackListed!"
                return 1
        return 0
    
    # Takes the JSON elements and goes through the URLs
    # and passes it through the blacklist regex to figure
    # out if its an advertisement
    # it adjusts the priority based on that
    def adjustPriority(self, elements):
        for element in elements:
            url = element['url']
            print url
            for f in self.blacklist:
                f = f[0:-1]
                regex = re.compile(f)
                r = regex.search(url)
                if r:
                    print "Found!"
                    element['priority'] = 10
        return elements

    
    def print_call_count(self):
        print self.call_count
        self.call_count = 0

    # Creates the blacklist and whitelist in memory
    def start(self, file):
        
        # uncomment this if running this file independently
        # and comment the one below.

#        files = ["easylist/easylist_adservers.txt",
#             "easylist/easylist_general_block.txt",
#             "easylist/easylist_general_hide.txt",
#             "easylist/easylist_specific_block.txt",
#             "easylist/easylist_specific_hide.txt",
#             "easylist/easylist_thirdparty.txt",
#             "easylist/easylist_whitelist.txt"]

        return self.parse_filter(file)
        
#        print "Whitelist: " + str(len(self.whitelist)) + " Bytes: " + str(sys.getsizeof(self.whitelist))
#        print "Blacklist: " + str(len(self.blacklist)) + " Bytes: " + str(sys.getsizeof(self.blacklist))
    
def main():

    n = open("newlist.js", "w")
    n.write("var trackerList = {\n");

    categories = 0;

    for fileName in os.listdir("."):
        if fileName.endswith(".category"):
            parser = EasyListParser()
            parser.start(fileName)

            if categories != 0:
                n.write(',')
            categories += 1
            
            n.write("\t'"+fileName[:-len(".category")]+"': \n\t[")

            regex = '\|\|.+\^'
            count = 0
            for line in parser.blacklist:
                count += 1
                newline = "\t\t\"" +line.rstrip("\n")
                newline = newline + "\",\n"
                n.write(newline)
            n.write("]\n")

    n.write("}")


    # parser = EasyListParser()
    # parser.start('easylist.txt')


    
#    url = "http://ec.atdmt.com/ds/GZSRTSPNTCON/Evo_Updated_5_31/TS2C25_Sprint_EVO4GLaunch_Audio_300x250.swf?ver=1&clickTag1=http://at.atwola.com/adlink/5113/1838313/0/170/AdId=3143974;BnId=1;itime=640570493;nodecode=yes;impref=13426405712586145155;link=http://clk.atdmt.com/go/405296167/direct;wi.300;hi.250;ai.282779434;ct.1/01&clickTag=http://at.atwola.com/adlink/5113/1838313/0/170/AdId=3143974;BnId=1;itime=640570493;nodecode=yes;impref=13426405712586145155;link=http://clk.atdmt.com/go/405296167/direct;wi.300;hi.250;ai.282779434;ct.1/01"
    # url = ""
    # if parser.check_if_ad(url):
    #     print "Low Priority!"
    # else:
    #     print "Normal Priority"
    
if __name__ == '__main__':
    main()