class AddSounds < ActiveRecord::Migration[5.2]
  def change
      create_table :sounds do |t|
        t.string :filename
        t.belongs_to :user
    end
  end
end
