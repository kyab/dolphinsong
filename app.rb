require "sinatra"

get "/" do
	"hello"
end

get "/testerb" do
	@foo = "hoge"

	erb :index, :locals=> {:one=>"one", :two=>"two"}
end
