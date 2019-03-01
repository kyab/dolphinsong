require "active_record"

class Song < ActiveRecord::Base
    belongs_to :user
end
