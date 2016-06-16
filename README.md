#API: URL Shortener Microservice

##User Story:
I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.
If I pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain an error instead.
When I visit that shortened URL, it will redirect me to my original link.

##Usage:
Get a shortened URL in the JSON response:
https://gall.ga/v1/getshort/https://www.example.com

Get original URL in the JSON response form short URL ID:
https://gall.ga/v1/getoriginal/1

Use the shortended URL:
https://gall.ga/1
