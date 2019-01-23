require "sinatra"
require "sinatra/reloader"

get "/" do
	"hello"
end

get "/testerb" do
	@foo = "hoge"

	erb :index, :locals=> {:one=>"one", :two=>"two"}
end
