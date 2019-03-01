import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import * as base from './views/base';

const state = {};

//SEARCH CONTROLLER
const controlSearch = async () => {
  //Get query from the view
  const query = searchView.getInput();
  //console.log(query);
  
  if (query){
    //New search object and add to state
    state.search = new Search(query);

    //Prepare UI results
    searchView.clearInput();
    searchView.clearSearchResList();
    base.renderLoader(base.elements.searchRes);

    try{
      //Search for recipes
      await state.search.getResults();
    
      //Render results in UI
      base.clearLoader();
      searchView.renderResults(state.search.result);
      //console.log(state.search.result);

    }catch(err){
      alert('Error! Fail to load results');
      base.clearLoader();
    }
  
  }

}

base.elements.searchForm.addEventListener('submit', event => {
    event.preventDefault();
    controlSearch();
});

base.elements.searchResPages.addEventListener('click', event => {
    const btn = event.target.closest('.btn-inline');
    if (btn){
      const goToPage = parseInt(btn.dataset.goto, 10); 
      searchView.clearSearchResList();
      searchView.renderResults(state.search.result, goToPage);
      console.log(goToPage);
    }
});

//RECIPE CONTROLLER
const controlRecipe = async () => {
    //Get ID from URL
    const id = window.location.hash.replace('#' ,'');

    if(id){
      //Prepare UI for changes
      recipeView.clearRecipeList();
      base.renderLoader(base.elements.recipe);

      //Highlight selected search
      if(state.search) searchView.highlightSelected(id);
      
      //Create new recipe object
      state.recipe = new Recipe(id);

      try{
        //Get recipe data and parse ingredient
        await state.recipe.getRecipe();
        //console.log(state.recipe.ingredients);
        state.recipe.parseIngredients();

        //Calculate servings and time
        state.recipe.calcServings();
        state.recipe.calcTime();

        //Render recipe
        base.clearLoader();
        recipeView.renderRecipe(state.recipe, state.likes ? state.likes.isLiked(id) : undefined);

      }catch(err){
        //console.log(err);
        alert('Error! Fail to load recipe.');
      }

    }
};

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//List Controller
const controlList = () => {
  //Create a new list IF no existing list
  if(!state.list) state.list = new List();

  //Add each ingredient into the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//Handel delete and update list item event
base.elements.shopping.addEventListener('click', event => {
  const id = event.target.closest('.shopping__item').dataset.itemid;

  //Handle delete button event
  if(event.target.matches('.shopping__delete, .shopping__delete *')){
    //Delete from list
    state.list.deleteItem(id);

    //Delete from UI
    listView.deleteItem(id);

    //Handle Update
  }else if(event.target.matches('.shopping_count-value')){
    const val = parseFloat(event.target.value, 10);
    state.list.updateCount(id, val);
  }

});

//Like Controller
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  if(!state.likes.isLiked(currentID)){
    const newlike = state.likes.addLikes(
      state.recipe.id,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img,
    );

    likesView.toggleLikeBtn(true);

    likesView.renderLike(newlike);
  }else{
    state.likes.deleteLike(currentID);

    likesView.toggleLikeBtn(false);

    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};  

//Restore like recipe when page loads
window.addEventListener('load', () => {
  state.likes = new Likes();

  state.likes.readStorage();

  likesView.toggleLikeMenu(state.likes.getNumLikes());

  state.likes.likes.forEach(like => likesView.renderLike(like));
}); 

//Handeling recipe button click
base.elements.recipe.addEventListener('click', event => {
  if(event.target.matches('.btn-decrease, .btn-decrease *')){
    //Decrease is clicked
    if(state.recipe.servings > 1){
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }
  }else if (event.target.matches('.btn-increase, .btn-increase *')){
    //Increase is clicked
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  }else if(event.target.matches('.recipe__btn--add, .recipe__btn--add *')){
    //Add ingredient into shopping list
    controlList();
  }else if (event.target.matches('.recipe__love, .recipe__love *')){
    //Add recipe into like list
    controlLike();
  }
  
});
