
require "fileutils"

count = 0
Dir.glob("__sounds/stems/*/*.wav") do |file|
	puts "----- processing file. : #{file}"

	dir = "__splitted/"+ File.dirname(file)

	puts "--creating directory : #{dir}"
	FileUtils.mkdir_p(dir) unless FileTest.exist?(dir)

	cmd = %Q{ffmpeg -y -i "#{file}" -af "atrim=1" -c:v copy "__splitted/#{file}"}
	count += 1# system(cmd)
	puts cmd
	system(cmd)

end

puts count / 5