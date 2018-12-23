require 'net/http'

uri = URI("https://ruby-doc.org/stdlib-2.3.1/libdoc/uri/rdoc/URI.html?a=1&b=3")

    puts query = uri.query
    puts params = Hash[query.split("&").map{|s| s.split("=") }]
    puts uri.normalize
    puts uri.methods-Object.methods