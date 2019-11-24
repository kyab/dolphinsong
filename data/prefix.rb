


Dir.glob("sounds/*") do |file|
	puts "----- processing file. : #{file}"
	cmd = %Q{ffmpeg -y -i "#{file}" -af "adelay=1s|1s" -c:v copy "__#{file}"}
	system(cmd)

end


