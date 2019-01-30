require "sinatra/base"
require "sinatra/reloader"

class DolphinSong < Sinatra::Base

	set :bind, "0.0.0.0"
	get "/hello" do
		"hello"
	end

	get "/" do
		@track_num = 5
		erb :dolphinsong
	end

	get "/testerb" do
		@foo = "hoge"

		erb :index, :locals=> {:one=>"one", :two=>"two"}
	end

	if app_file == $0
		puts app_file
		puts "now run!"
		run!
	end
end
