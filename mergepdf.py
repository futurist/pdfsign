#!/usr/bin/python
# -*- coding: utf-8 -*-

import PyPDF2 as pypdf
import sys
import getopt

# TOOLS: http://williamjturkel.net/2013/08/24/working-with-pdfs-using-command-line-tools-in-linux/
# yum install -y xpdf pdftk poppler-utils
# pdftotext a.pdf a.txt

def mergePDF(inpath, imgpath, p, outpath):
    content = []
    inFile = open(inpath, "rb")
    p-=1
    # overlay = open(imgpath, "rb")
    with open(imgpath, "rb") as overlay:

        original = pypdf.PdfFileReader(inFile)
        foreground = pypdf.PdfFileReader(overlay).getPage(0)

        background = original.getPage(p)
        background.mergePage(foreground)

        # add all pages to a writer
        writer = pypdf.PdfFileWriter()
        for i in range(original.getNumPages()):
            page = original.getPage(i)
            writer.addPage(page)
            #content.append(page.extractText().encode('utf-8').replace("\xa0", " "))

        # write everything in the writer to a file
        with open(outpath, "wb") as outFile:
            writer.addMetadata({'/Producer': 'yumji'})
            writer.write(outFile)
        #print '\n'.join(content)
        # don't rely on pyPDF to get text, using xpdf command pdftotext instead.
        print "ok"

def main(argv):
    inputfile = ''
    outputfile = ''
    markfile = ''
    page=1

    try:
        opts, args = getopt.getopt(argv,"hi:m:p:o:",["in=", "mark=", "page=", "out="])
    except getopt.GetoptError:
        print 'test.py -i <inputfile> -o <outputfile>'
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print sys.argv[0], ' -i <inputfile> -o <outputfile>'
            sys.exit()
        elif opt in ("-i", "--in"):
            inputfile = arg
        elif opt in ("-m", "--mark"):
            markfile = arg
        elif opt in ("-p", "--page"):
            page = int(arg)
        elif opt in ("-o", "--out"):
            outputfile = arg
    # print inputfile, markfile, outputfile
    if inputfile and markfile and outputfile:
        mergePDF(inputfile, markfile, page, outputfile)
    else:
        print "arguments error."

if __name__ == "__main__":
    main(sys.argv[1:])


