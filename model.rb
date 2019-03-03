require "active_record"

ActiveRecord::Base.establish_connection(
    adapter: "sqlite3",
    database: "dolphinsong.db" 
)


class User < ActiveRecord::Base
    has_many :songs
    has_many :sounds
end

class Song < ActiveRecord::Base
    # belongs_to :user
    belongs_to :user
end

class Sound < ActiveRecord::Base
    belongs_to :user
end

# user1 = User.new
# user1.name = "user1"
# user1.password = "user1pass"
# user1.save

# user2 = User.new
# user2.name = "user2"
# user2.password = "user2pass"
# user2.save

# song1 = Song.new
# song1.user_name = "user2"
# song1.title = "song3"
# song1.path = "song3.json"
# song1.save

# song2 = Song.new
# song2.user_name = "user2"
# song2.title = "song4"
# song2.path = "song4.json"
# song2.save


# user1 = User.find(2)
# u2er1.password="ch2nged password"
# user12sav22

