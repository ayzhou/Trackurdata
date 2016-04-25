import argparse
import json
import numpy
import warnings
import csv

def median(lst):
    return numpy.median(numpy.array(lst)).item()

def mean(lst):
	return numpy.mean(numpy.array(lst)).item()

def stddev(lst):
	return numpy.std(numpy.array(lst)).item()

if __name__ == "__main__":
	parser = argparse.ArgumentParser(description='This parses data files generated from the Trackurdata extension')

	parser.add_argument('-t', '--trackers_csv', action="store", help="Enter the path for the tracker csv")
	parser.add_argument('-a', '--analysis', action="store", default='cwt', help="Enter a string where 'c' signals category analysis, 'w' signals website analysis, and 't' signals tracker analysis. i.e. 'cw' signals to do category and website analysis")
	parser.add_argument('-c', '--categories_json', action="store", help="Enter the path for the category json")

	args = parser.parse_args()

	#do category analysis
	if 'c' in args.analysis:
		#print categories for csv output
		print "#Category Analysis"
		print "Category,Number of Trackers,Number of Websites Found on, Timings Median, Timings Std Dev, Size Sum, Size Median, Size Std Dev, Duration Sum, Duration Median, Duration Std Dev"
		categories_file = open(args.categories_json, "r")
		category_json = json.load(categories_file)

		for category in category_json:
			website_count = 0
			website_median_timings = []
			for website in category_json[category]['timings']:
				website_count+=1
				med = median(category_json[category]['timings'][website])
				website_median_timings.append(med)

			num_trackers = len(category_json[category]['trackers'])
			if num_trackers == 0:
				continue
			category_mean = median(website_median_timings)
			category_stddev =  stddev(website_median_timings)
			category_size_sum = float(category_json[category]['stats']['responseSize']['sum'])
			category_size_median = float(category_json[category]['stats']['responseSize']['median'])
			category_size_stddev = float(category_json[category]['stats']['responseSize']['stdDev'])
			category_durations_sum = float(category_json[category]['stats']['responseDurations']['sum'])
			category_durations_median = float(category_json[category]['stats']['responseDurations']['median'])
			category_durations_stddev = float(category_json[category]['stats']['responseDurations']['stdDev'])

			print "%s,%d,%d,%f,%f,%f,%f,%f,%f,%f,%f" % (category, num_trackers, website_count, category_mean, 
				category_stddev, category_size_sum, category_size_median, category_size_stddev, 
				category_durations_sum, category_durations_median, category_durations_stddev)

	if 'w' in args.analysis:
		print "#Website Analysis"
		print "Website Found, Durations Sum, Durations Median, Durations Std Dev, Request Size Sum, Request Size Median, Request Size Std Dev"

		trackers_file = open(args.trackers_csv, "r")
		tracker_csv = csv.DictReader(trackers_file)

		website_stats = {}
		for row in tracker_csv:
			website = row['Website']
			try:
				duration = float(row['Duration (ms)'])
			except ValueError:
				duration = 0

			try: 
				header_size = float(row['Response Header Size (bytes)'])
			except ValueError:
				header_size = 0

			try:
				response_size = float(row['Response Body Size (bytes)'])
			except:
				response_size = 0
			response_size = header_size + response_size

			#if no website, add it
			try:
				website_stats[website]
			except KeyError:
				website_stats[website] = {}

			# add the duration if not there
			try:
				website_stats[website]['durations']
			except KeyError:
				website_stats[website]['durations'] = []

			website_stats[website]['durations'].append(duration)

			#add response_size 
			try:
				website_stats[website]['sizes']
			except KeyError:
				website_stats[website]['sizes'] = []

			website_stats[website]['sizes'].append(response_size)

		for website in website_stats:
			sum_durations = sum(website_stats[website]['durations'])
			median_durations = median(website_stats[website]['durations'])
			stddev_durations = stddev(website_stats[website]['durations'])

			sum_sizes = sum(website_stats[website]['sizes'])
			median_sizes = median(website_stats[website]['sizes'])
			stddev_sizes = stddev(website_stats[website]['sizes'])

			print "%s,%f,%f,%f,%f,%f,%f" % (website,sum_durations,median_durations,stddev_durations,sum_sizes,median_sizes,stddev_sizes)

		print '#website durations'
		for website in website_stats:
			print website+',',
		print ''
		i = 0
		printed = True
		while (printed):
			printed = False
			for website in website_stats:
				durations = website_stats[website]['durations']
				if i < len(durations):
					printed = True
					print website_stats[website]['durations'][i],
				print ',',
			i += 1
			print ''

		print '#website sizes'
		for website in website_stats:
			print website+',',
		print ''
		i = 0
		printed = True
		while (printed):
			printed = False
			for website in website_stats:
				durations = website_stats[website]['sizes']
				if i < len(durations):
					printed = True
					print website_stats[website]['sizes'][i],
				print ',',
			i += 1
			print ''



		# print website_stats








