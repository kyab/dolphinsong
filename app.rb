require "sinatra"
require "sinatra/reloader"

get "/" do
	"hello"
end

get "/dolphinsong" do
	@track_num = 5
	erb :dolphinsong
end

get "/testerb" do
	@foo = "hoge"

	erb :index, :locals=> {:one=>"one", :two=>"two"}
end
