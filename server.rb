require 'json'
require 'net/http'
require 'erb'
require 'base64'

class Explorer

  def initialize root
    @root = root
  end

  def file path
    
    raise Errno::ENOENT, "No such file" unless File.file?(path)

    File.read(path)
    
  end

  def fetch entry
    return if entry == "." or entry == ".."
    item = { path: entry, class: "folder", type: "", size: "", created: File.ctime(entry).to_i, modified: File.mtime(entry).to_i }
    if File.file?(entry)
      item[:class] = "file"   
      item[:size] = File.size(entry)
      item[:type] = File.extname(entry).gsub(".","")
    end
    item
  end

  def get_entries xpath
    items = []
    
    Dir.chdir(xpath[0]) do
      Dir.entries(Dir.pwd, encoding: Encoding::UTF_8).sort.each do |entry|
        item = fetch(entry)
        if item && item[:path] == xpath[1]
          item[:entries] = get_entries(xpath[1..-1])
        end
        items << item if item
      end
    end
    items.sort_by{|item|  [ item[:class]=="folder" ? 0 : 1, item[:path]] }
  end

  def dir path
    entries = {}

    raise "no such folder" unless File.directory?(@root+path)
    Dir.chdir(@root) do
      xpath = [".",*path.split("/").reject{|s| s.empty?}]
      entries = get_entries(xpath)
    end
    entries
  end
end

class Server

  ROOT = "c:/Projects"
  HOME = "/File"
  LOGS = "/File/logs"

  PATHS = {
    "ROOT" => ROOT,
    "HOME" => HOME,
    "LOGS" => LOGS
  }

  WELCOME = File.join(ROOT, HOME, "index.erb")

  NODES = {
    "web_master" => "WEB::MASTER",
    "web_slave" => "WEB::SLAVE",
    "plan_master" => "PLAN::MASTER",
    "plan_slave" => "PLAN::SLAVE",
    "sp_master" => "SP::MASTER",
    "sp_slave" => "SP::SLAVE",
    "driver_master" => "DRIVER::MASTER",
    "driver_slave" => "DRIVER::SLAVE"
  }

  attr_reader :server
  def initialize
    @server = TCPServer.new('localhost', 2345)
    @explorer = Explorer.new(ROOT)
    # @filename = Time.now.strftime("logs/server_log_%Y%m%d_%H%M%S.log")
    @filename = Time.now.strftime("logs/server_log.log")
    info "start server..."
  end
  def start
    
      loop do
        Thread.start(@server.accept) do |socket|
          request = socket.gets
          debug request.inspect
          begin
            if request
              path, query = parse(request)
              debug "path = " + path.to_s
              debug "query = " + query.to_s
              debug File.join(ROOT, HOME)
              debug path == File.join(ROOT, HOME)

              if path == File.join(ROOT, HOME)
                if query[:folder]
                  folder = query[:folder]
                  folder_request(folder, query[:node], socket)
                elsif query[:file] 
                  # file_request(query[:file], query[:node], socket)
                  file_download_request(query[:file], query[:node], socket)
                else
                  welcome_page(path, socket)
                end

              elsif File.file?(path)
                  file_request(path, nil, socket)

              elsif File.directory?(path)
                  folder_request(path, nil, socket)

              else
                  not_found(path, socket)
              end

            end
          rescue Exception => err
            error err
            not_found(path, socket)
            # socket.print err.to_s + err.backtrace.join("\n")
          ensure
            socket.close
          end
        end
      end
    
  end

  def stop
    # Thread.current.kill
  end

  private
  def error err
    log "[ERROR] #{err.message}\r\n" + err.backtrace.join("\r\n")
  end
  def info message
    log "[INFO] #{message}"
  end
  def debug message
    log "[DEBUG] #{message}"
  end
  def log message
    File.open(@filename, "a+"){|f| f.puts Time.now.strftime("%F %T.%3N -- ") + message}
  end

  def parse request
    return unless request
    request_uri = URI(request.split(" ")[1])

    path = get_path(request_uri)
    query = {}
    if request_uri.query
      query = Hash[request_uri.query.split("&").map{|s| k, v = s.split("="); [k.to_sym, v.nil? ? "" : v] }]
      if query[:node]
        query[:node] = unescape(query[:node]) 
      end
      if query[:folder]
        query[:folder] = unescape(query[:folder])
        query[:folder] = clean_path(query[:folder])
      end
      if query[:file]
    puts query
    puts query[:file]
    puts URI.decode(query[:file])
    puts URI.unescape(query[:file]) 
        query[:file] = unescape(query[:file]) 
        query[:file] = clean_path(query[:file])
        query[:file] = File.join(ROOT, query[:file])
      end
    end
    return path, query
  end
  def unescape url_sting
    CGI::unescape(url_sting)
  end
  def get_path uri
    path = unescape(uri.path)
    path = clean_path(File.join(HOME, path))
    path = File.join(ROOT, path)
  end
  def clean_path path
    clean = []
    parts = path.split("/")
    parts.each do |part|
      next if part == '.'
      part == '..' ? clean.pop : clean << part
    end
    path = clean.join("/")
  end

  def welcome_page(path, socket)

    container_content = @explorer.dir(".")

    html = get_welcome_page(NODES, HOME, ROOT, LOGS)

    socket.print "HTTP/1.1 200 OK\r\n" +
                 "Content-Type: text/html; charset=utf-8\r\n" +
                 "Content-Length: #{html.bytesize}\r\n" +
                 "Connection: close\r\n"
    socket.print "\r\n"
    socket.print html
  end

  def get_welcome_page(nodes, home, root, logs)
    ERB.new( File.read(WELCOME) ).result(binding)
  end

  TYPES = {
    ".html" => "text/html",
    ".css"  => "text/css",
    ".js"   => "application/javascript",
    ".jpg"  => "image/jpeg",
    ".png"  => "image/png",
    ".rar"  => "application/x-rar-compressed",
    ".zip"  => "application/zip",
  }
  TYPES.default = "text/plain"

  def file_request(path, node, socket)
    File.open(path, "rb"){|file|
      socket.print "HTTP/1.1 200 OK\r\n" +
                   "Content-Type: #{TYPES[File.extname(file)]}\r\n" +
                   "Content-Length: #{file.size}\r\n" +
                   "Connection: close\r\n"
      socket.print "\r\n"
      # IO.copy_stream(file, socket)
      socket.write file.read
    }
  end

  def file_download_request(path, node, socket)
    File.open(path, "rb"){|file|
      content = Base64.strict_encode64(file.read)
      # content = file.read
      puts content.size
      socket.print "HTTP/1.1 200 OK\r\n" +
                   "Content-Type: #{TYPES[File.extname(file)]}\r\n" +
                   "Content-Length: #{content.size}\r\n" +
                   "Connection: close\r\n"
      socket.print "\r\n"
      socket.write content
    }
    # socket.print "HTTP/1.1 200 OK\r\n" +
    #              "Content-Type: #{TYPES[File.extname(path)]}\r\n" +
    #              "Content-Length: #{file.size}\r\n" +
    #              "Connection: close\r\n"
    # socket.print "\r\n"
    # socket.write Base64.strict_encode64(File.open(path, "rb").read)
  end

  def folder_request(path, node, socket)
    info path
    info node
    text = JSON.generate(@explorer.dir(path))
    socket.print "HTTP/1.1 200 OK\r\n" +
                 "Content-Type: application/x-www-form-urlencoded; charset=utf-8\r\n" +
                 "Content-Length: #{text.bytesize}\r\n" +
                 "Connection: close\r\n"
    socket.print "\r\n"
    socket.print text
  end

  def not_found(path, socket)
    text = "File not found"
    socket.print "HTTP/1.1 404 Not Found\r\n" +
                 "Content-Type: text/html; charset=utf-8\r\n" +
                 "Content-Length: #{text.bytesize}\r\n" +
                 "Connection: close\r\n"
    socket.print "\r\n"
    socket.print text
  end

end
