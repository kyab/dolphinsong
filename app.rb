require "sinatra/base"
require "sinatra/reloader"

class DolphinSong < Sinatra::Base
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

	run! if app_file == $0
end
