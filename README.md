# Trackurdata

Dependencies: Python, Charles proxy( free edition is fine), Chrome 

To USE:

1) Import the Trackurdata extension. This can be done by going to chrome://extensions, Load unpacked extensions, then selecting the Trackurdata directory.

2) Select the categories that you want to do analysis for, then click run. Make sure that the Charles proxy is running in the background to catch all requests and its data.

3) Once done, export the data that you just recorded by going to Charles->File->Export session->Save as CSV

4) Import this CSV to trackurdata, and then click Parse. Once done, the results text box will contain a CSV of all the trackers that it found as well as the data about these trackers. Ctrl-A to highlight and then save this as a CSV in the Results directory.

5) Select the number of timing iterations to do, then click Run.

6) Copy the resultant JSON and save it to the results directory. 
