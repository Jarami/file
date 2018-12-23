require './server.rb'
begin
  Server.new.start
rescue Exception => err
  puts err
end
