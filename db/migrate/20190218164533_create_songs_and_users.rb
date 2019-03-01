class CreateSongsAndUsers < ActiveRecord::Migration[5.2]
  def change
    create_table :users do |t|
      t.string :name
      t.string :password
    end

    create_table :songs do |t|
      t.belongs_to :user
      t.string :title
      t.string :path
    end
  end
end
