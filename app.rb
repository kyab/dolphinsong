require "sinatra/base"
require "sinatra/reloader"

class DolphinSong < Sinatra::Base

	set :bind, "0.0.0.0"
	configure :development do
		register Sinatra::Reloader
	end

	configure :production do
		register Sinatra::Reloader
	end

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

	post "/upload" do

		@filename = params[:upfile][:filename]
		save_path = "./public/sounds/#{@filename}"
		
		puts "Saving : #{save_path}"
		File.open(save_path , "wb") do |f|
			f.write params[:upfile][:tempfile].read
		end
		@files = Dir.glob("*" , base:"public/sounds")
		puts "files = :" 
		p @files
		erb :files
	end

	if app_file == $0
		puts app_file
		puts "now run!"
		run!
	end
end
