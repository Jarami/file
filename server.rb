require 'json'
require 'net/http'
require 'erb'

class Explorer
  def initialize root
    @root = root
  end

  def file path
    
    raise Errno::ENOENT, "No such file" unless File.file?(path)

    File.read(path)
    
  end

  def dir path

    raise Errno::ENOENT, "No such directory" unless File.directory?(path)

    info = {}

    info[:path] = File.realpath(path)
    info[:class] = "folder"
    info[:created] = File.ctime(path).to_i
    info[:modified] = File.mtime(path).to_i
    info[:entries] = [
      {path: "..", class: "up", created: File.ctime("..").to_i, modified: File.mtime("..").to_i}
    ]

    Dir.chdir(path) do

      folders = []
      files = []
      Dir.entries(Dir.pwd).sort.each do |entry|
        next if entry == "." || entry == ".."
        item = {path: entry, class: nil, created: File.ctime(entry).to_i, modified: File.mtime(entry).to_i}
        folders << item.merge(class: "folder") if File.directory?(entry)
        files   << item.merge(class: "file")   if File.file?(entry)
      end
      info[:entries] += folders
      info[:entries] += files

    end

    [info]
  end
end

class Server

  PATHS = {
    "ROOT" => "c:/Projects",
    "HOME" => "c:/Projects/File",
    "LOGS" => "c:/Projects/File/logs",
  }

  NODES = {
    "web-master" => "WEB::MASTER",
    "web-slave" => "WEB::SLAVE",
    "plan-master" => "PLAN::MASTER",
    "plan-slave" => "PLAN::SLAVE",
    "sp-master" => "SP::MASTER",
    "sp-slave" => "SP::SLAVE",
    "driver-master" => "DRIVER::MASTER",
    "driver-slave" => "DRIVER::SLAVE"
  }

  attr_reader :server
  def initialize
    @server = TCPServer.new('localhost', 2345)
    @explorer = Explorer.new(PATHS["ROOT"])
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
            debug path

            if path == ""
                if query[:folder]
                  folder = PATHS[query[:folder]] || query[:folder]
                  folder_request(folder, query[:node], socket)
                elsif query[:file] 
                  file_request(query[:file], query[:node], socket)
                else
                  welcome_page(path, socket)
                end

            elsif File.file?(path)
                file_request(path, nil, socket)
            elsif File.directory? path
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
      query = Hash[request_uri.query.split("&").map{|s| k, v = s.split("="); [k.to_sym, v] }]
      if query[:node]
        query[:node] = URI.unescape(query[:node]) 
      end
      if query[:folder]
        query[:folder] = URI.unescape(query[:folder])
        query[:folder] = clean_path(query[:folder])
      end
      if query[:file]
        query[:file] = URI.unescape(query[:file]) 
        query[:file] = clean_path(query[:file])
      end
    end
    return path, query
  end

  def get_path uri
    path = URI.unescape(uri.path[1..-1])
    clean_path(path)
  end
  def clean_path path
    clean = []
    parts = path.split("/")
    parts.each do |part|
      next if part.empty? || part == '.'
      part == '..' ? clean.pop : clean << part
    end
    path = clean.join("/")
  end

  def welcome_page(path, socket)

    container_content = @explorer.dir(".")

    html = get_welcome_page(NODES, PATHS["HOME"], PATHS["ROOT"], PATHS["LOGS"])

    socket.print "HTTP/1.1 200 OK\r\n" +
                 "Content-Type: text/html; charset=utf-8\r\n" +
                 "Content-Length: #{html.bytesize}\r\n" +
                 "Connection: close\r\n"
    socket.print "\r\n"
    socket.print html
  end

  def get_welcome_page(nodes, home, root, logs)
    ERB.new( File.read("index.erb") ).result(binding)
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

  def folder_request(path, node, socket)
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
