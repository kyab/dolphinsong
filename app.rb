require "sinatra/base"
require "sinatra/reloader"
require "json"
require "sinatra/activerecord"
require "dotenv"
require "./model.rb"
require "httpclient"
require "uri"

require "omniauth-twitter"

require "pp"

Dotenv.load

class DolphinSong < Sinatra::Base
	
	register Sinatra::ActiveRecordExtension
	set :database, {adapter: "sqlite3",database: "dolphinsong.db" }
	set :bind, "0.0.0.0"
	
	use Rack::Session::Cookie, :secret=>"pass"

	#https://tyfkda.github.io/blog/2015/02/11/omni-auth.html
	use OmniAuth::Builder do
		  # Twitter の OAuth を使う
		puts "use omniauth"
  		provider :twitter, ENV["TWITTER_API_KEY"] , ENV["TWITTER_API_SECRET_KEY"]
	end

	configure :development do
		register Sinatra::Reloader
	end

	configure :production do
		register Sinatra::Reloader
	end

	#testing sinatra
	get "/hello" do
		"hello"
	end

	#testing login
	get "/login" do
		if (params[:status])
			@wrong = true
		else
			@wrong = false
		end
		erb :login
	end

	post "/do_login" do

		name = params[:name]
		password = params[:password]
		
		puts "do_login with name=#{name}, pass=#{password}"
		
		if (name==nil || password==nil)
			redirect "/login?status=wrong"
		end
		
		user = User.find_by_name(name)
		if (user)
			if (user.password == password)
				session[:user] = user.name
				session[:uid] = user.id
				p session
				redirect "/"
			end
		end

		redirect "/login?status=wrong"

	end

	get "/do_logout" do
		session.clear

		redirect "/"
	end

	#callback url for twitter login
	get "/auth/twitter/callback" do
		puts "callback from twitter!!"
		# pp request.env["omniauth.auth"]

		result = request.env["omniauth.auth"]

		session[:user] = result["info"]["name"]
		session[:icon] = result["info"]["image"]


		pp session

		#save to db if not exist
		twitter_uid = result["uid"]
		if (!User.find_by(twitter_uid:twitter_uid))
			puts "new user"
			user = User.new
			user.name = session[:user]
			user.auth_method = "twitter"
			user.twitter_uid = twitter_uid
			user.save
		else
			puts "existing user"
		end
		user = User.find_by(twitter_uid: twitter_uid)
		session[:uid] = user.id

		redirect "/"
	end

	get "/auth/failure" do
		# sometimes failed.
		redirect "/login"
	end

	#our top
	get "/" do
		@track_num = 5
		@files = Dir.glob("*" , base:"data/sounds").sort do |a,b|
			ret = a.casecmp(b)
			ret == 0 ? a<=>b : ret
		end

		if (session[:user])
			@user = session[:user]
		end
		if (session[:icon])
			@icon = session[:icon]
		end

		@keymap = ["Z","X","C","V","B"]

		erb :dolphinsong
	end

	get "/daw" do
		erb :daw
	end

	get "/daw2" do
		erb :daw2
	end

	get "/daw3" do
		erb :daw3
	end

	get "/stemControl" do
		erb :stemControl
	end

	#testing erb
	get "/testerb" do
		@foo = "hoge"

		erb :index, :locals=> {:one=>"one", :two=>"two"}
	end

	helpers do
		def filelist
			@files = Dir.glob("*" , base:"data/sounds").sort do |a,b|
				ret = a.casecmp(b)
				ret == 0 ? a<=>b : ret
			end
			@files.to_json
		end

		def songlist
			@files = Dir.glob("*", base:"data/songs").sort do |a,b|
				ret = a.casecmp(b)
				ret == 0 ? a<=>b : ret
			end
			@files.to_json
		end
	end

	post "/upload" do

		if !session[:user]
			puts "no login upload"
			halt 401, "Not authorized\n"
		end

		@filename = params[:upfile][:filename]
		save_path = "./data/sounds/#{@filename}"
		
		#TODO : avoid override file.

		puts "Saving : #{save_path}"
		File.open(save_path , "wb") do |f|
			f.write params[:upfile][:tempfile].read
		end

		#save to db if not exist
		user = User.find_by id:session[:uid]
		sound = Sound.new
		sound.user_id = user.id
		sound.filename = @filename
		sound.save	

		puts "separating to stems by myspleeter service"

		#step1 : add 1sec silent to head 
		#ffmpeg -i WARGNER.wav -af "adelay=1s|1s" -c:v copy WAGNER_prefixed.wav
		
		#step2 : spleeter it.
		client = HTTPClient.new()
		url = "http://localhost:8080/separate/" + @filename
		url = URI.escape(url)
		puts "requesting to " + url
		response = client.get(url)
		puts "response.status = " + response.status.to_s
		puts "response : " + response.body

		#step1 : trim 1sec from head.
		#ffmpeg -i drums.wav  -af "atrim=1" -c:v copy drums_split.wav
		#

		content_type :json
		filelist

	end

	post "/uploadblob" do
		@filename = params[:fname]
		save_path = "./data/sounds/#{@filename}"
		
		puts "Saving : #{save_path}"
		File.open(save_path , "wb") do |f|
			f.write params[:upfile][:tempfile].read
		end

		puts "separating to stems by myspleeter service"

		client = HTTPClient.new()
		url = "http://localhost:8080/separate/" + @filename
		puts "requesting to " + url
		response = client.get(url)
		puts "response.status = " + response.status.to_s
		puts "response : " + response.body

		content_type :json
		filelist

	end

	post "/uploadsong" do
		songJSON = request.body.read
		songObj = JSON.parse(songJSON)
		title = songObj["title"] + ".json"
		File.open("./data/songs/#{title}", "w") do |f|
			f.write songJSON
		end
		p songObj
		"ok, title=#{title}"
	end

	post "/delete/sound" do
		if (!session)
			halt 403, "403 no session"
		end
		user_id = session["uid"]
		if (!user_id) 
			halt 403, "403 no login"
		end

		if (!params[:name])
			halt 403, "invalid parameter"
		end

		user = User.find_by id:user_id
		if (!user)
			halt 403, "403 no user : #{user_id}"
		end

		sound = Sound.find_by filename:params[:name]
		if (!sound)
			halt 403, "403 no sound : #{params[:name]}"
		end

		if (sound.user_id == user.id)
			puts "delete"
			File.delete("./data/sounds/#{params[:name]}")
			sound.destroy
		else
			halt 403, "403 owner mismatch"
		end

		"ok"
	end

	# get "/sound/:file" do
	# 	send_file "data/sounds/#{params[:file]}"
	# end

	get "/sound/:file" do
		puts "hi #{params[:file]}"
		name = File.basename(params[:file], ".*")
		path = "data/sounds/stems/#{name}/drums.wav"
		send_file path
	end

	get "/sound/:file/:stem" do
		puts "hi #{params[:file]}, #{params[:stem]}"
		name = File.basename(params[:file], ".*")
		stem = params[:stem]
		path = "data/sounds/stems/#{name}/#{stem}.wav"
		puts "path = " + path
		send_file path

	end

	get "/song/:file" do
		send_file "data/songs/#{params[:file]}"
	end

	get "/soundlist" do
		content_type :json
		filelist
	end

	get "/songlist" do
		content_type :json
		songlist
	end


	if app_file == $0
		puts app_file
		puts "now run!"
		run!
	end
end
