require "sinatra/base"
require "sinatra/reloader"

require "json"

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
		@files = Dir.glob("*" , base:"public/sounds").sort do |a,b|
			ret = a.casecmp(b)
			ret == 0 ? a<=>b : ret
		end
		erb :dolphinsong
	end

	get "/testerb" do
		@foo = "hoge"

		erb :index, :locals=> {:one=>"one", :two=>"two"}
	end

	helpers do
		def filelist
			@files = Dir.glob("*" , base:"public/sounds").sort do |a,b|
				ret = a.casecmp(b)
				ret == 0 ? a<=>b : ret
			end
			puts "files = :" 
			p @files
			@files.to_json
		end
	end

	post "/upload" do

		@filename = params[:upfile][:filename]
		save_path = "./public/sounds/#{@filename}"
		
		puts "Saving : #{save_path}"
		File.open(save_path , "wb") do |f|
			f.write params[:upfile][:tempfile].read
		end
		content_type :json
		filelist

	end

	post "/uploadblob" do
		@filename = params[:fname]
		save_path = "./public/sounds/#{@filename}"
		
		puts "Saving : #{save_path}"
		File.open(save_path , "wb") do |f|
			f.write params[:upfile][:tempfile].read
		end
		content_type :json
		filelist
	end

	get "/soundlist" do
		content_type :json
		filelist
	end


	if app_file == $0
		puts app_file
		puts "now run!"
		run!
	end
end
